"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { addToCart, MAX_QUANTITY_PER_ITEM, removeCartItem, updateCartItem } from "@/lib/cart";
import { getSessionUser } from "@/lib/session";

export type CartActionState = { error?: string; success?: string };

function parseQuantity(value: FormDataEntryValue | null): number | null {
  const quantity = Number(value);
  return Number.isInteger(quantity) && quantity >= 1 && quantity <= MAX_QUANTITY_PER_ITEM ? quantity : null;
}

export async function addToCartAction(_prev: CartActionState, formData: FormData): Promise<CartActionState> {
  const productId = String(formData.get("productId") ?? "");
  const user = await getSessionUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/product/${productId}`)}`);

  const quantity = parseQuantity(formData.get("quantity"));
  if (quantity === null) return { error: `Quantity must be between 1 and ${MAX_QUANTITY_PER_ITEM}.` };

  const result = await addToCart(user.id, productId, quantity);
  if (!result.ok) return { error: result.error };

  revalidatePath("/", "layout");
  return { success: "Added to cart." };
}

export async function updateCartItemAction(_prev: CartActionState, formData: FormData): Promise<CartActionState> {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/cart");

  const quantity = parseQuantity(formData.get("quantity"));
  if (quantity === null) return { error: `Quantity must be between 1 and ${MAX_QUANTITY_PER_ITEM}.` };

  const result = await updateCartItem(user.id, String(formData.get("productId") ?? ""), quantity);
  if (!result.ok) return { error: result.error };

  revalidatePath("/", "layout");
  return {};
}

export async function removeCartItemAction(formData: FormData): Promise<void> {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/cart");

  await removeCartItem(user.id, String(formData.get("productId") ?? ""));
  revalidatePath("/", "layout");
}
