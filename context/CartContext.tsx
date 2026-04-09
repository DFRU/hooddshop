"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type { ShopifyCart } from "@/types/shopify";
import {
  getStoredCartId,
  createCart,
  addToCart as addToCartApi,
  updateCartLine,
  removeFromCart as removeFromCartApi,
  getCart,
} from "@/lib/cart";

interface CartContextType {
  cart: ShopifyCart | null;
  isOpen: boolean;
  isLoading: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (variantId: string) => Promise<void>;
  updateQuantity: (lineId: string, quantity: number) => Promise<void>;
  removeItem: (lineId: string) => Promise<void>;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<ShopifyCart | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const cartId = getStoredCartId();
    if (cartId) {
      getCart(cartId).then((c) => {
        if (c) setCart(c);
      });
    }
  }, []);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const addItem = useCallback(
    async (variantId: string) => {
      setIsLoading(true);
      try {
        let updatedCart: ShopifyCart | null;
        if (cart?.id) {
          updatedCart = await addToCartApi(cart.id, variantId);
        } else {
          updatedCart = await createCart(variantId);
        }
        if (updatedCart) {
          setCart(updatedCart);
          setIsOpen(true);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [cart]
  );

  const updateQuantity = useCallback(
    async (lineId: string, quantity: number) => {
      if (!cart?.id) return;
      setIsLoading(true);
      try {
        const updatedCart = await updateCartLine(cart.id, lineId, quantity);
        if (updatedCart) setCart(updatedCart);
      } finally {
        setIsLoading(false);
      }
    },
    [cart]
  );

  const removeItem = useCallback(
    async (lineId: string) => {
      if (!cart?.id) return;
      setIsLoading(true);
      try {
        const updatedCart = await removeFromCartApi(cart.id, [lineId]);
        if (updatedCart) setCart(updatedCart);
      } finally {
        setIsLoading(false);
      }
    },
    [cart]
  );

  return (
    <CartContext.Provider
      value={{
        cart,
        isOpen,
        isLoading,
        openCart,
        closeCart,
        addItem,
        updateQuantity,
        removeItem,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
