import { randomUUID } from "node:crypto";

/** Dummy payment cards accepted by the app (see frontend/lib/orders.ts). */
export const CARDS = {
  success: "4242 4242 4242 4242",
  declined: "4000 0000 0000 0002",
  // Passes Luhn but is not one of the supported test cards.
  unsupported: "5555 5555 5555 4444",
} as const;

export const DELIVERY = {
  standardCents: 499,
  expressCents: 999,
  freeStandardFromCents: 5000,
} as const;

export const MAX_QUANTITY_PER_ITEM = 10;

/**
 * Seeded products (docs/products-seed.csv). Each test that changes stock uses its own product
 * so stock assertions stay deterministic when tests run in parallel.
 */
export const PRODUCTS = {
  cheapCable: "Baseus Braided USB-C Cable 1.5m White", // 9.99, in stock
  iphoneCase: "Spigen Slim Case for iPhone 15", // 19.99, in stock
  budgetCable: "McDodo Braided USB-C Cable 1.5m Black", // 7.99, in stock
  wirelessCharger: "Spigen 15W Wireless Charger Blue", // 29.99, in stock
  usbCharger: "UGREEN 20W USB-C Charger Black", // 15.99, in stock
  headphones: "Anker ANC Headphones Blue", // 79.99, in stock
  screenProtector: "Nillkin Privacy Glass for Galaxy S24", // 14.99, in stock
  smartphone: "Google Pixel 8 256GB", // 859.99, in stock
  outOfStock: "Baseus 20W USB-C Charger Black", // stock 0
} as const;

export const CATALOG = {
  totalProducts: 100,
  categories: { smartphone: 25, case: 20, charger: 15, cable: 15, headphones: 15, screen_protector: 10 },
  iphoneMatches: 11,
} as const;

export type Customer = { email: string; password: string; name: string };

/** Unknown emails are registered on first login, so a fresh email gives every test its own account. */
export function newCustomer(prefix = "e2e"): Customer {
  const local = `${prefix}.${randomUUID().slice(0, 8)}`;
  return { email: `${local}@example.com`, password: "Secret123!", name: local };
}

export type Address = {
  recipient: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  postalCode: string;
  country: string;
};

export const ADDRESS: Address = {
  recipient: "Ana Popescu",
  phone: "+40 721 345 678",
  line1: "Str. Lalelelor 10",
  line2: "Ap. 4",
  city: "Bucharest",
  postalCode: "010101",
  country: "RO",
};

export type Payment = { cardName: string; cardNumber: string; expiry: string; cvc: string };

export function payment(cardNumber: string = CARDS.success): Payment {
  const nextYear = (new Date().getFullYear() + 1) % 100;
  return { cardName: "Ana Popescu", cardNumber, expiry: `12/${String(nextYear).padStart(2, "0")}`, cvc: "123" };
}
