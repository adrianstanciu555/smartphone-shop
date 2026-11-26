import { expect } from "@playwright/test";

/*
 * Response contracts as asymmetric matchers. Use with `toEqual`, which also fails on unexpected
 * extra fields (e.g. a leaked password hash), so these work like strict JSON schemas.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const uuid = () => expect.stringMatching(UUID);

export const money = (amount?: number) => ({ amount: amount ?? expect.any(Number), currency: "EUR" });

export const CATEGORY_VALUES = ["smartphone", "case", "charger", "cable", "headphones", "screen_protector"] as const;

export const productContract = () => ({
  id: uuid(),
  sku: expect.any(String),
  name: expect.any(String),
  brand: expect.any(String),
  category: expect.stringMatching(new RegExp(`^(${CATEGORY_VALUES.join("|")})$`)),
  price: money(),
  rating: expect.any(Number),
  availability: expect.stringMatching(/^(in_stock|low_stock|out_of_stock)$/),
  images: expect.any(Array),
});

export const userContract = (email: string) => ({ id: uuid(), email, name: expect.any(String) });

export const cartItemContract = () => ({
  productId: uuid(),
  name: expect.any(String),
  brand: expect.any(String),
  quantity: expect.any(Number),
  unitPrice: money(),
  lineTotal: money(),
  available: expect.any(Boolean),
});

export const orderContract = () => ({
  id: uuid(),
  number: expect.stringMatching(/^\d+$/),
  status: expect.any(String),
  deliveryMethod: expect.stringMatching(/^(standard|express)$/),
  items: expect.any(Array),
  subtotal: money(),
  tax: money(),
  delivery: money(),
  total: money(),
  address: expect.any(Object),
  createdAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
});
