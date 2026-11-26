import Link from "next/link";
import { logout } from "@/app/actions/auth";
import { getCartItemCount } from "@/lib/cart";
import { getSessionUser } from "@/lib/session";

export async function Header() {
  const user = await getSessionUser();
  const cartCount = user ? await getCartItemCount(user.id) : 0;

  return (
    <header className="border-b border-slate-200 bg-white">
      <nav aria-label="Main" className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3">
        <Link href="/catalog" className="text-lg font-bold text-indigo-700" data-testid="nav-home">
          Smartphone Shop
        </Link>
        <Link href="/catalog" className="text-sm hover:underline" data-testid="nav-catalog">
          Catalog
        </Link>
        <div className="ml-auto flex items-center gap-4 text-sm">
          <Link href="/cart" className="hover:underline" data-testid="nav-cart">
            Cart (<span data-testid="cart-count">{cartCount}</span>)
          </Link>
          {user ? (
            <>
              <span data-testid="user-greeting">
                Hello, <strong data-testid="user-name">{user.name}</strong>
              </span>
              <form action={logout}>
                <button type="submit" className="rounded border border-slate-300 px-3 py-1 hover:bg-slate-100" data-testid="logout-button">
                  Log out
                </button>
              </form>
            </>
          ) : (
            <Link href="/login" className="rounded bg-indigo-600 px-3 py-1 text-white hover:bg-indigo-700" data-testid="nav-login">
              Log in
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
