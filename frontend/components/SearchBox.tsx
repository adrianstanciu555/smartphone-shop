"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Suggestion = { id: string; name: string; brand: string; price: { amount: number; currency: string } };

type Result = { term: string } & (
  | { status: "loading" }
  | { status: "error" }
  | { status: "done"; items: Suggestion[] }
);

const MIN_CHARS = 2;
const DEBOUNCE_MS = 250;
const SUGGESTION_LIMIT = 5;

const price = new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" });

/** Catalog search input with live suggestions from GET /api/v1/products. */
export function SearchBox({ defaultValue }: { defaultValue: string }) {
  const [query, setQuery] = useState(defaultValue);
  const [touched, setTouched] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  const term = query.trim();
  const active = touched && term.length >= MIN_CHARS;
  // Results for an older term are never shown, so stale links cannot be clicked during the debounce.
  const view = !active ? null : result?.term === term ? result : { status: "loading" as const };

  useEffect(() => {
    if (!active) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setResult({ term, status: "loading" });
      try {
        const params = new URLSearchParams({ q: term, pageSize: String(SUGGESTION_LIMIT) });
        const response = await fetch(`/api/v1/products?${params}`, { signal: controller.signal });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const body = (await response.json()) as { items: Suggestion[] };
        setResult({ term, status: "done", items: body.items });
      } catch {
        if (!controller.signal.aborted) setResult({ term, status: "error" });
      }
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [active, term]);

  return (
    <div className="relative">
      <input
        id="q"
        name="q"
        type="search"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setTouched(true);
        }}
        placeholder="e.g. iPhone"
        autoComplete="off"
        aria-describedby="search-suggestions-status"
        className="rounded border border-slate-300 px-3 py-2"
        data-testid="search-input"
      />
      <div
        id="search-suggestions-status"
        role="status"
        className={view ? "absolute z-10 mt-1 w-80 rounded border border-slate-200 bg-white p-2 text-sm shadow" : "sr-only"}
        data-testid="search-suggestions"
      >
        {view?.status === "loading" && <p data-testid="suggestions-loading">Searching…</p>}
        {view?.status === "error" && <p data-testid="suggestions-error">Suggestions are unavailable. Press Apply to search.</p>}
        {view?.status === "done" && view.items.length === 0 && <p data-testid="suggestions-empty">No suggestions.</p>}
        {view?.status === "done" && view.items.length > 0 && (
          <ul aria-label="Suggestions">
            {view.items.map((item) => (
              <li key={item.id} data-testid="suggestion">
                <Link href={`/product/${item.id}`} className="flex justify-between gap-3 rounded px-2 py-1 hover:bg-slate-100">
                  <span data-testid="suggestion-name">{item.name}</span>
                  <span className="text-slate-500" data-testid="suggestion-price">{price.format(item.price.amount)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
