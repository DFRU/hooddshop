import { shopifyFetch } from "./shopify";
import {
  CREATE_CART,
  ADD_TO_CART,
  UPDATE_CART,
  REMOVE_FROM_CART,
  GET_CART,
} from "./queries/cart";
import type { ShopifyCart } from "@/types/shopify";

const CART_STORAGE_KEY = "hoodd_cart_id";

export function getStoredCartId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(CART_STORAGE_KEY);
}

export function setStoredCartId(id: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CART_STORAGE_KEY, id);
}

export function clearStoredCartId(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CART_STORAGE_KEY);
}

/** Read the geo_country cookie set by middleware, default to US. */
function getBuyerCountry(): string {
  if (typeof document === "undefined") return "US";
  const match = document.cookie.match(/(?:^|;\s*)geo_country=([^;]*)/);
  return match?.[1] || "US";
}

/** Detect browser language, e.g. "EN", "FR", "ES". */
function getBuyerLanguage(): string {
  if (typeof navigator === "undefined") return "EN";
  const lang = navigator.language?.split("-")[0]?.toUpperCase();
  return lang || "EN";
}

export async function createCart(
  variantId: string,
  quantity: number = 1,
  attributes?: { key: string; value: string }[]
): Promise<ShopifyCart | null> {
  const country = getBuyerCountry();
  const language = getBuyerLanguage();

  const line: Record<string, unknown> = { merchandiseId: variantId, quantity };
  if (attributes?.length) line.attributes = attributes;

  const { data } = await shopifyFetch<{
    data: { cartCreate: { cart: ShopifyCart } };
  }>({
    query: CREATE_CART,
    variables: {
      lines: [line],
      buyerIdentity: { countryCode: country },
      country,
      language,
    },
  });
  const cart = data?.cartCreate?.cart;
  if (cart) setStoredCartId(cart.id);
  return cart || null;
}

export async function addToCart(
  cartId: string,
  variantId: string,
  quantity: number = 1,
  attributes?: { key: string; value: string }[]
): Promise<ShopifyCart | null> {
  const country = getBuyerCountry();
  const language = getBuyerLanguage();

  const line: Record<string, unknown> = { merchandiseId: variantId, quantity };
  if (attributes?.length) line.attributes = attributes;

  const { data } = await shopifyFetch<{
    data: { cartLinesAdd: { cart: ShopifyCart } };
  }>({
    query: ADD_TO_CART,
    variables: { cartId, lines: [line], country, language },
  });
  return data?.cartLinesAdd?.cart || null;
}

export async function updateCartLine(
  cartId: string,
  lineId: string,
  quantity: number
): Promise<ShopifyCart | null> {
  const country = getBuyerCountry();
  const language = getBuyerLanguage();

  const { data } = await shopifyFetch<{
    data: { cartLinesUpdate: { cart: ShopifyCart } };
  }>({
    query: UPDATE_CART,
    variables: { cartId, lines: [{ id: lineId, quantity }], country, language },
  });
  return data?.cartLinesUpdate?.cart || null;
}

export async function removeFromCart(
  cartId: string,
  lineIds: string[]
): Promise<ShopifyCart | null> {
  const country = getBuyerCountry();
  const language = getBuyerLanguage();

  const { data } = await shopifyFetch<{
    data: { cartLinesRemove: { cart: ShopifyCart } };
  }>({
    query: REMOVE_FROM_CART,
    variables: { cartId, lineIds, country, language },
  });
  return data?.cartLinesRemove?.cart || null;
}

export async function getCart(
  cartId: string
): Promise<ShopifyCart | null> {
  const country = getBuyerCountry();
  const language = getBuyerLanguage();

  const { data } = await shopifyFetch<{
    data: { cart: ShopifyCart };
  }>({
    query: GET_CART,
    variables: { cartId, country, language },
  });
  return data?.cart || null;
}
