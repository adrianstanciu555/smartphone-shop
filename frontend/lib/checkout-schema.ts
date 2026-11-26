import { z } from "zod";
import { TEST_CARDS, type PlaceOrderInput } from "./orders";

function passesLuhn(digits: string): boolean {
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let digit = Number(digits[digits.length - 1 - i]);
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  return sum % 10 === 0;
}

function isFutureExpiry(value: string): boolean {
  const [month, year] = value.split("/").map(Number);
  const now = new Date();
  const expiryMonthIndex = (2000 + year) * 12 + (month - 1);
  return expiryMonthIndex >= now.getFullYear() * 12 + now.getMonth();
}

const required = (label: string, max = 100) =>
  z
    .string({ error: `${label} is required.` })
    .trim()
    .min(1, { error: `${label} is required.` })
    .max(max, { error: `${label} is too long.` });

/** Shared by the checkout server action (form fields) and POST /api/v1/checkout (JSON body). */
export const checkoutSchema = z.object({
  recipient: required("Full name"),
  phone: z.string().trim().regex(/^\+?[0-9][0-9 ()-]{5,19}$/, { error: "Enter a valid phone number." }),
  line1: required("Address line 1", 200),
  line2: z.string().trim().max(200, { error: "Address line 2 is too long." }).default(""),
  city: required("City"),
  postalCode: z.string().trim().regex(/^[A-Za-z0-9 -]{3,10}$/, { error: "Enter a valid postal code." }),
  country: z.string().trim().regex(/^[A-Za-z]{2}$/, { error: "Use a 2-letter country code, e.g. RO." }),
  deliveryMethod: z.enum(["standard", "express"], { error: "Choose a delivery method." }),
  cardName: required("Name on card"),
  cardNumber: z
    .string()
    .transform((value) => value.replace(/[\s-]/g, ""))
    .pipe(
      z
        .string()
        .regex(/^\d{16}$/, { error: "Card number must have 16 digits." })
        .refine(passesLuhn, { error: "Card number is invalid." })
        .refine((value) => Object.values(TEST_CARDS).includes(value as never), {
          error: "Card not supported. Use a test card.",
        }),
    ),
  expiry: z
    .string()
    .trim()
    .regex(/^(0[1-9]|1[0-2])\/\d{2}$/, { error: "Use MM/YY format." })
    .refine(isFutureExpiry, { error: "Card has expired." }),
  cvc: z.string().trim().regex(/^\d{3}$/, { error: "CVC must be 3 digits." }),
});

export function toPlaceOrderInput(data: z.output<typeof checkoutSchema>, idempotencyKey: string): PlaceOrderInput {
  return {
    idempotencyKey,
    deliveryMethod: data.deliveryMethod,
    cardNumber: data.cardNumber,
    address: {
      recipient: data.recipient,
      phone: data.phone,
      line1: data.line1,
      line2: data.line2 || undefined,
      city: data.city,
      postalCode: data.postalCode,
      country: data.country.toUpperCase(),
    },
  };
}
