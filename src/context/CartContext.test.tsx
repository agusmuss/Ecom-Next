import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { CartProvider, useCart } from "./CartContext";

const storageKey = "minicommerce-cart";

const wrapper = ({ children }: { children: ReactNode }) => (
  <CartProvider>{children}</CartProvider>
);

const sampleItem = {
  productId: "prod_1",
  title: "Sample",
  price: 12,
  currency: "EUR",
  quantity: 1,
  stripePriceId: "price_1",
  image: "https://example.com/sample.png",
};

describe("CartContext", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("loads items from localStorage", async () => {
    window.localStorage.setItem(storageKey, JSON.stringify([sampleItem]));

    const { result } = renderHook(() => useCart(), { wrapper });

    await waitFor(() => {
      expect(result.current.items).toHaveLength(1);
    });
  });

  it("adds items and increments quantity for duplicates", () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addItem(sampleItem);
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].quantity).toBe(1);

    act(() => {
      result.current.addItem(sampleItem);
    });

    expect(result.current.items[0].quantity).toBe(2);
  });

  it("updates quantity but never below 1", () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addItem(sampleItem);
    });

    act(() => {
      result.current.updateQuantity(sampleItem.productId, 0);
    });

    expect(result.current.items[0].quantity).toBe(1);
  });

  it("removes items", () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addItem(sampleItem);
    });

    act(() => {
      result.current.removeItem(sampleItem.productId);
    });

    expect(result.current.items).toHaveLength(0);
  });

  it("clears the cart", () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addItem(sampleItem);
    });

    act(() => {
      result.current.clearCart();
    });

    expect(result.current.items).toHaveLength(0);
  });

  it("syncs cart to localStorage", async () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addItem(sampleItem);
    });

    await waitFor(() => {
      const stored = window.localStorage.getItem(storageKey);
      expect(stored).toContain(sampleItem.productId);
    });
  });

  it("throws if useCart is used outside provider", () => {
    const { result } = renderHook(() => {
      try {
        return useCart();
      } catch (error) {
        return error as Error;
      }
    });

    expect(result.current).toBeInstanceOf(Error);
    expect((result.current as Error).message).toBe(
      "useCart must be used within a CartProvider"
    );
  });
});
