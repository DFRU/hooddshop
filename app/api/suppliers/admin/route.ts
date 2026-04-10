import { NextRequest, NextResponse } from "next/server";
import { getSuppliers } from "@/lib/suppliers/repository";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const token = process.env.SUPPLIER_ADMIN_TOKEN;

  if (!token || !authHeader || authHeader !== `Bearer ${token}`) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const suppliers = getSuppliers();

  return NextResponse.json({
    total: suppliers.length,
    active: suppliers.filter((s) => s.status === "active").length,
    verification_pending: suppliers.filter(
      (s) => s.status === "verification_pending"
    ).length,
    suppliers,
  });
}
