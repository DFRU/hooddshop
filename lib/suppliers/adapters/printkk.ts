/**
 * Printkk supplier adapter.
 *
 * Spec: UPLOAD-PIPELINE-SPEC.md §6.3
 * Blocker B2: Printkk file delivery method.
 *
 * Auth: API Key + Secret Key (set in .env.local as PRINTKK_API_KEY, PRINTKK_SECRET_KEY)
 * Base URL: PRINTKK_API_BASE env var
 */
import crypto from "crypto";
import type {
  SupplierAdapter,
  PrintJobInput,
  PrintJobSubmission,
  PrintJobStatusResponse,
} from "./types";
import { PRINTKK_PRODUCT_CODE, DEFAULT_SIZE, type ProductSize } from "../constants";

const API_KEY = process.env.PRINTKK_API_KEY || "";
const SECRET_KEY = process.env.PRINTKK_SECRET_KEY || "";
const API_BASE = process.env.PRINTKK_API_BASE || "";

function generateSignature(signStr: string, secretKey: string): string {
  return crypto.createHmac("sha256", secretKey).update(signStr).digest("hex");
}

export class PrintkkAdapter implements SupplierAdapter {
  readonly id = "printkk";

  async submitJob(input: PrintJobInput): Promise<PrintJobSubmission> {
    if (!API_BASE) {
      throw new Error(
        "[printkk] PRINTKK_API_BASE not configured. Set the Printkk API endpoint URL."
      );
    }
    if (!API_KEY || !SECRET_KEY) {
      throw new Error(
        "[printkk] PRINTKK_API_KEY or PRINTKK_SECRET_KEY not configured."
      );
    }

    const size: ProductSize = input.productSize ?? DEFAULT_SIZE;

    console.log(`[printkk] submitJob: Starting submission flow for job ${input.customerReference} (Size: ${size}).`);

    // 1. Download image from printFileUrl
    console.log(`[printkk] submitJob [1/5]: Fetching image from ${input.printFileUrl}...`);
    const imgRes = await fetch(input.printFileUrl);
    if (!imgRes.ok) {
      throw new Error(`[printkk] Failed to download print file from URL: ${imgRes.status} ${imgRes.statusText}`);
    }
    const arrayBuffer = await imgRes.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);
    const fileName = input.printFileUrl.split("/").pop() || "design.png";

    // 2. Upload image to POST /api/v1/image
    console.log(`[printkk] submitJob [2/5]: Uploading image ${fileName} (${fileBuffer.length} bytes)...`);
    const uploadTimestamp = String(Date.now());
    const recvWindow = "5000";

    const uploadParams: Record<string, string> = {
      fileName,
      recvWindow,
      timestamp: uploadTimestamp,
    };
    const sortedUploadParams = Object.keys(uploadParams)
      .sort()
      .map(k => `${k}=${uploadParams[k]}`)
      .join("&");
    const uploadSignStr = `POST\n/api/v1/image\n${sortedUploadParams}`;
    const uploadSignature = generateSignature(uploadSignStr, SECRET_KEY);

    const boundary = `----WebKitFormBoundary${crypto.randomBytes(8).toString("hex")}`;
    const parts: Buffer[] = [];

    parts.push(Buffer.from(`--${boundary}\r\n`));
    parts.push(Buffer.from(`Content-Disposition: form-data; name="file"; filename="${fileName}"\r\n`));
    parts.push(Buffer.from(`Content-Type: image/png\r\n\r\n`));
    parts.push(fileBuffer);
    parts.push(Buffer.from(`\r\n`));

    const uploadFields = {
      fileName,
      timestamp: uploadTimestamp,
      recvWindow,
      signature: uploadSignature,
    };

    for (const [key, val] of Object.entries(uploadFields)) {
      parts.push(Buffer.from(`--${boundary}\r\n`));
      parts.push(Buffer.from(`Content-Disposition: form-data; name="${key}"\r\n\r\n`));
      parts.push(Buffer.from(`${val}\r\n`));
    }
    parts.push(Buffer.from(`--${boundary}--\r\n`));
    const multipartBody = Buffer.concat(parts);

    const uploadRes = await fetch(`${API_BASE}/api/v1/image`, {
      method: "POST",
      headers: {
        "Api-Key": API_KEY,
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
        "Accept": "application/json",
      },
      body: multipartBody,
    });

    if (!uploadRes.ok) {
      const text = await uploadRes.text();
      throw new Error(`[printkk] Image upload failed: ${uploadRes.status} — ${text.slice(0, 300)}`);
    }

    const uploadJson = await uploadRes.json();
    if (!uploadJson.success) {
      throw new Error(`[printkk] Image upload rejected by API: ${uploadJson.msg}`);
    }

    const imageId = String(uploadJson.data.id);
    console.log(`[printkk] submitJob [2/5]: Image uploaded successfully. ImageId: ${imageId}`);

    // 3. Create design task POST /api/v1/design
    console.log(`[printkk] submitJob [3/5]: Requesting design creation task...`);
    const designTimestamp = String(Date.now());
    const productCode = "5K14TS";
    const printAreaCode = "1812673652333338626";

    const printAreasStr = `[{printAreaCode=${printAreaCode}, imageId=${imageId}, imageFillingMode=cover}]`;

    const designSignParams: Record<string, string> = {
      isWhole: "1",
      productCode,
      productPrintAreas: printAreasStr,
      recvWindow,
      timestamp: designTimestamp,
    };

    const sortedDesignParams = Object.keys(designSignParams)
      .sort()
      .map(k => `${k}=${designSignParams[k]}`)
      .join("&");
    const designSignStr = `POST\n/api/v1/design\n${sortedDesignParams}`;
    const designSignature = generateSignature(designSignStr, SECRET_KEY);

    const designBody = {
      productCode,
      isWhole: 1,
      productPrintAreas: [
        {
          printAreaCode,
          imageId,
          imageFillingMode: "cover",
        },
      ],
      timestamp: Number(designTimestamp),
      recvWindow: Number(recvWindow),
      signature: designSignature,
    };

    const designRes = await fetch(`${API_BASE}/api/v1/design`, {
      method: "POST",
      headers: {
        "Api-Key": API_KEY,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(designBody),
    });

    if (!designRes.ok) {
      const text = await designRes.text();
      throw new Error(`[printkk] Design creation failed: ${designRes.status} — ${text.slice(0, 300)}`);
    }

    const designJson = await designRes.json();
    if (!designJson.success) {
      throw new Error(`[printkk] Design creation rejected by API: ${designJson.msg}`);
    }

    const taskId = String(designJson.data);
    console.log(`[printkk] submitJob [3/5]: Design task created. TaskId: ${taskId}`);

    // 4. Poll design task GET /api/v1/design/task/{taskId}
    console.log(`[printkk] submitJob [4/5]: Polling design task status...`);
    let designCode = "";
    // Poll up to 12 times with 3s interval (approx 36s maximum execution safety)
    for (let attempt = 1; attempt <= 12; attempt++) {
      await new Promise(resolve => setTimeout(resolve, 3000));
      const pollTimestamp = String(Date.now());
      const pollParams: Record<string, string> = {
        recvWindow,
        timestamp: pollTimestamp,
      };
      const sortedPollParams = Object.keys(pollParams)
        .sort()
        .map(k => `${k}=${pollParams[k]}`)
        .join("&");
      const pollSignStr = `GET\n/api/v1/design/task/${taskId}\n${sortedPollParams}`;
      const pollSignature = generateSignature(pollSignStr, SECRET_KEY);

      const pollRes = await fetch(
        `${API_BASE}/api/v1/design/task/${taskId}?${sortedPollParams}&signature=${pollSignature}`,
        {
          headers: {
            "Api-Key": API_KEY,
            "Accept": "application/json",
          },
        }
      );

      if (!pollRes.ok) {
        throw new Error(`[printkk] Poll task failed: ${pollRes.status} ${pollRes.statusText}`);
      }

      const pollJson = await pollRes.json();
      if (!pollJson.success) {
        throw new Error(`[printkk] Poll task API error: ${pollJson.msg}`);
      }

      const data = pollJson.data || {};
      console.log(`[printkk] Poll Attempt ${attempt}: status=${data.designTaskStatus}, designCode=${data.designCode}`);

      if (data.designCode) {
        designCode = data.designCode;
        break;
      }
      if (data.designTaskStatus === "failed") {
        throw new Error(`[printkk] Design task failed: ${data.msg}`);
      }
    }

    if (!designCode) {
      throw new Error(`[printkk] Design task polling timed out.`);
    }

    // 5. Query design details to map spec code GET /api/v1/design/{designCode}
    console.log(`[printkk] submitJob [5/5]: Retrieving design specifications...`);
    const detailsTimestamp = String(Date.now());
    const detailsParams: Record<string, string> = {
      recvWindow,
      timestamp: detailsTimestamp,
    };
    const sortedDetailsParams = Object.keys(detailsParams)
      .sort()
      .map(k => `${k}=${detailsParams[k]}`)
      .join("&");
    const detailsSignStr = `GET\n/api/v1/design/${designCode}\n${sortedDetailsParams}`;
    const detailsSignature = generateSignature(detailsSignStr, SECRET_KEY);

    const detailsRes = await fetch(
      `${API_BASE}/api/v1/design/${designCode}?${sortedDetailsParams}&signature=${detailsSignature}`,
      {
        headers: {
          "Api-Key": API_KEY,
          "Accept": "application/json",
        },
      }
    );

    if (!detailsRes.ok) {
      throw new Error(`[printkk] Get design details failed: ${detailsRes.status} ${detailsRes.statusText}`);
    }

    const detailsJson = await detailsRes.json();
    if (!detailsJson.success) {
      throw new Error(`[printkk] Get design details API error: ${detailsJson.msg}`);
    }

    const targetSpecName = size === "xl" ? '68"x55"' : '63"x47"';
    const specs = detailsJson.data?.designSpecifications || [];
    const matchedSpec = specs.find((s: any) => s.designSpecificationName === targetSpecName);

    if (!matchedSpec) {
      throw new Error(`[printkk] No design specification found matching size ${size} (${targetSpecName})`);
    }

    const specCode = matchedSpec.designSpecificationCode;
    console.log(`[printkk] submitJob [5/5]: Specification code mapped: ${specCode}`);

    // 6. Place the final order POST /api/v1/order
    console.log(`[printkk] submitJob: Submitting final order to Printkk...`);
    const orderTimestamp = String(Date.now());

    // Format address matching Lombok DTO order:
    // fullName -> addressLine1 -> addressLine2 -> city -> region -> countryCode -> zipCode -> phone -> email
    const addrParts: string[] = [];
    const addr = input.shippingAddress;
    if (addr.name) addrParts.push(`fullName=${addr.name}`);
    if (addr.address1) addrParts.push(`addressLine1=${addr.address1}`);
    if (addr.address2) addrParts.push(`addressLine2=${addr.address2}`);
    if (addr.city) addrParts.push(`city=${addr.city}`);
    if (addr.province) addrParts.push(`region=${addr.province}`);
    if (addr.countryCode) addrParts.push(`countryCode=${addr.countryCode}`);
    if (addr.zip) addrParts.push(`zipCode=${addr.zip}`);
    if (addr.phone) addrParts.push(`phone=${addr.phone}`);
    const addrStr = `{${addrParts.join(", ")}}`;

    const opStr = `[{designSpecificationCode=${specCode}, quantity=${input.quantity}}]`;
    const stStr = `[economy, standard, express]`;

    const orderSignParams: Record<string, string> = {
      orderProducts: opStr,
      recvWindow,
      shippingAddress: addrStr,
      shippingType: stStr,
      timestamp: orderTimestamp,
    };

    const sortedOrderParams = Object.keys(orderSignParams)
      .sort()
      .map(k => `${k}=${orderSignParams[k]}`)
      .join("&");
    const orderSignStr = `POST\n/api/v1/order\n${sortedOrderParams}`;
    const orderSignature = generateSignature(orderSignStr, SECRET_KEY);

    const orderBody = {
      orderProducts: [
        {
          designSpecificationCode: specCode,
          quantity: input.quantity,
        },
      ],
      shippingAddress: {
        fullName: addr.name,
        addressLine1: addr.address1,
        addressLine2: addr.address2 || undefined,
        city: addr.city,
        region: addr.province,
        countryCode: addr.countryCode,
        zipCode: addr.zip,
        phone: addr.phone || undefined,
      },
      shippingType: ["economy", "standard", "express"],
      timestamp: Number(orderTimestamp),
      recvWindow: Number(recvWindow),
      signature: orderSignature,
    };

    const orderRes = await fetch(`${API_BASE}/api/v1/order`, {
      method: "POST",
      headers: {
        "Api-Key": API_KEY,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(orderBody),
    });

    if (!orderRes.ok) {
      const text = await orderRes.text();
      throw new Error(`[printkk] Order submission failed: ${orderRes.status} — ${text.slice(0, 300)}`);
    }

    const orderJson = await orderRes.json();
    if (!orderJson.success) {
      throw new Error(`[printkk] Order submission rejected by API: ${orderJson.msg}`);
    }

    const providerOrderId = String(orderJson.data);
    console.log(`[printkk] submitJob: Submission successful. Provider Order ID: ${providerOrderId}`);

    return {
      providerOrderId,
    };
  }

  async getStatus(providerOrderId: string): Promise<PrintJobStatusResponse> {
    if (!API_BASE) {
      throw new Error("[printkk] PRINTKK_API_BASE not configured.");
    }
    if (!API_KEY || !SECRET_KEY) {
      throw new Error("[printkk] API credentials not configured.");
    }

    const timestamp = String(Date.now());
    const recvWindow = "5000";

    const params: Record<string, string> = {
      recvWindow,
      timestamp,
    };
    const sortedParams = Object.keys(params)
      .sort()
      .map(k => `${k}=${params[k]}`)
      .join("&");
    const signStr = `GET\n/api/v1/order/${providerOrderId}\n${sortedParams}`;
    const signature = generateSignature(signStr, SECRET_KEY);

    const res = await fetch(`${API_BASE}/api/v1/order/${providerOrderId}?${sortedParams}&signature=${signature}`, {
      headers: {
        "Api-Key": API_KEY,
        "Accept": "application/json",
      },
    });

    if (!res.ok) {
      throw new Error(`[printkk] getStatus failed for ${providerOrderId}: ${res.status}`);
    }

    const data = await res.json();
    if (!data.success) {
      throw new Error(`[printkk] getStatus API rejected query: ${data.msg}`);
    }

    const orderDetail = data.data || {};
    const rawStatus = String(orderDetail.orderStatus || "").toLowerCase();

    // Map Printkk orderStatus to our normalized states
    const statusMap: Record<string, PrintJobStatusResponse["state"]> = {
      pendingpayment: "accepted",
      waitingforfulfillment: "accepted",
      beingfulfilled: "in_production",
      partiallyshipped: "shipped",
      shipped: "shipped",
      completed: "delivered",
      canceled: "canceled",
      closed: "canceled",
    };

    const state = statusMap[rawStatus] || "accepted";

    // Extract tracking details if shipped
    let trackingCarrier: string | undefined = undefined;
    let trackingNumber: string | undefined = undefined;

    const shippingList = orderDetail.orderProductShippingList || [];
    if (shippingList.length > 0) {
      // Use the first package details if present
      const pkg = shippingList[0];
      trackingCarrier = pkg.carrierName || undefined;
      trackingNumber = pkg.shippingOrderId || undefined;
    }

    return {
      state,
      trackingCarrier,
      trackingNumber,
      lastUpdate: orderDetail.payTime || orderDetail.createTime || new Date().toISOString(),
    };
  }

  async cancelJob(providerOrderId: string): Promise<boolean> {
    if (!API_BASE) return false;
    if (!API_KEY || !SECRET_KEY) return false;

    try {
      const timestamp = String(Date.now());
      const recvWindow = "5000";

      const params: Record<string, string> = {
        recvWindow,
        timestamp,
      };
      const sortedParams = Object.keys(params)
        .sort()
        .map(k => `${k}=${params[k]}`)
        .join("&");
      const signStr = `PUT\n/api/v1/order/cancel/${providerOrderId}\n${sortedParams}`;
      const signature = generateSignature(signStr, SECRET_KEY);

      const body = {
        timestamp: Number(timestamp),
        recvWindow: Number(recvWindow),
        signature,
      };

      const res = await fetch(`${API_BASE}/api/v1/order/cancel/${providerOrderId}`, {
        method: "PUT",
        headers: {
          "Api-Key": API_KEY,
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) return false;
      const json = await res.json();
      return !!json.success;
    } catch {
      return false;
    }
  }
}
