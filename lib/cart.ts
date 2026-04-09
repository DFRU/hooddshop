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

export async function createCart(
  variantId: string,
  quantity: number = 1
): Promise<ShopifyCart | null> {
  const { data } = await shopifyFetch<{
    data: { cartCreate: { cart: ShopifyCart } };
  }>({
    query: CREATE_CART,
    variables: { lines: [{ merchandiseId: variantId, quantity }] },
  });
  const cart = data?.cartCreate?.cart;
  if (cart) setStoredCartId(cart.id);
  return cart || null;
}

export async function addToCart(
  cartId: string,
  variantId: string,
  quantity: number = 1
): Promise<ShopifyCart | null> {
  const { data } = await shopifyFetch<{
    data: { cartLinesAdd: { cart: ShopifyCart } };
  }>({
    query: ADD_TO_CART,
    variables: { cartId, lines: [{ merchandiseId: variantId, quantity }] },
  });
  return data?.cartLinesAdd?.cart || null;
}

export async function updateCartLine(
  cartId: string,
  lineId: string,
  quantity: number
): Promise<ShopifyCart | null> {
  const { data } = await shopifyFetch<{
    data: { cartLinesUpdate: { cart: ShopifyCart } };
  }>({
    query: UPDATE_CART,
    variables: { cartId, lines: [{ id: lineId, quantity }] },
  });
  return data?.cartLinesUpdate?.cart || null;
}

export async function removeFromCart(
  cartId: string,
  lineIds: string[]
): Promise<ShopifyCart | null> {
  const { data } = await shopifyFetch<{
    data: { cartLinesRemove: { cart: ShopifyCart } };
  }>({
    query: REMOVE_FROM_CART,
    variables: { cartId, lineIds },
  });
  return data?.cartLinesRemove?.cart || null;
}

export async function getCart(
  cartId: string
): Promise<ShopifyCart | null> {
  const { data } = await shopifyFetch<{
    data: { cart: ShopifyCart };
  }>({
    query: GET_CART,
    variables: { cartId },
  });
  return data?.cart || null;
}
