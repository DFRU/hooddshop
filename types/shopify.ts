export interface ShopifyImage {
  url: string;
  altText: string | null;
  width: number;
  height: number;
}

export interface ShopifyPrice {
  amount: string;
  currencyCode: string;
}

export interface ShopifyVariant {
  id: string;
  title: string;
  availableForSale: boolean;
  price: ShopifyPrice;
  selectedOptions: { name: string; value: string }[];
  image: ShopifyImage | null;
  sku?: string;
}

export interface ShopifyProduct {
  id: string;
  handle: string;
  title: string;
  description: string;
  descriptionHtml?: string;
  tags: string[];
  priceRange: {
    minVariantPrice: ShopifyPrice;
  };
  images: {
    edges: { node: ShopifyImage }[];
  };
  options?: {
    name: string;
    values: string[];
  }[];
  variants: {
    edges: {
      node: ShopifyVariant;
    }[];
  };
}

export interface ShopifyCollection {
  id: string;
  handle: string;
  title: string;
  description: string;
  image: ShopifyImage | null;
}

export interface ShopifyCart {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  cost: {
    totalAmount: ShopifyPrice;
    subtotalAmount: ShopifyPrice;
  };
  lines: {
    edges: {
      node: {
        id: string;
        quantity: number;
        attributes: { key: string; value: string }[];
        merchandise: {
          id: string;
          title: string;
          product: {
            handle: string;
            title: string;
            images: {
              edges: { node: ShopifyImage }[];
            };
          };
          price: ShopifyPrice;
        };
      };
    }[];
  };
}

export interface PageInfo {
  hasNextPage: boolean;
  endCursor: string | null;
}

export interface ProductConnection {
  edges: { node: ShopifyProduct }[];
  pageInfo: PageInfo;
}
