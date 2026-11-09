'use client';

/**
 * The distribution partner's cart (doitac-1410 #034, #035): several plans
 * gathered before one checkout. Kept in this browser — it is a shopping list,
 * the price is read again from the server when they pay.
 */

import { useSyncExternalStore } from 'react';

export type CartLine = {
  planId: number;
  name: string;
  destinationName: string | null;
  unitPriceVnd: number;
  quantity: number;
  /** Days of a day pass (vande #014); absent for a fixed plan. */
  periodNum?: number | null;
};

/** A line is a plan for a number of days: 7 and 10 days are two lines. */
export function cartLineKey(line: { planId: number; periodNum?: number | null }): string {
  return `${line.planId}:${line.periodNum && line.periodNum > 1 ? line.periodNum : ''}`;
}

const KEY = 'esim_partner_cart';
const listeners = new Set<() => void>();
let cache: CartLine[] | null = null;
const EMPTY: CartLine[] = [];

function read(): CartLine[] {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as CartLine[]) : [];
    cache = Array.isArray(parsed) ? parsed.filter((l) => l && l.planId > 0 && l.quantity > 0) : [];
  } catch {
    cache = [];
  }
  return cache;
}

function write(lines: CartLine[]): void {
  cache = lines;
  try {
    localStorage.setItem(KEY, JSON.stringify(lines));
  } catch {
    // Private mode: the cart still works for this page.
  }
  listeners.forEach((fn) => fn());
}

export function addToCart(line: CartLine): void {
  const lines = read();
  const key = cartLineKey(line);
  const existing = lines.find((l) => cartLineKey(l) === key);
  write(
    existing
      ? lines.map((l) =>
          cartLineKey(l) === key ? { ...line, quantity: l.quantity + line.quantity } : l
        )
      : [...lines, line]
  );
}

export function setCartQuantity(key: string, quantity: number): void {
  write(
    quantity > 0
      ? read().map((l) => (cartLineKey(l) === key ? { ...l, quantity } : l))
      : read().filter((l) => cartLineKey(l) !== key)
  );
}

export function removeFromCart(key: string): void {
  write(read().filter((l) => cartLineKey(l) !== key));
}

/**
 * Take the server's prices into the stored lines (doitac-0911 #003).
 * A line keeps the price it was added at, and the price moves with the
 * exchange rate and the partner's tier: the bar read 312.000đ while checkout
 * took 314.000đ. Writes only when a price actually changed.
 */
export function syncCartPrices(
  prices: { planId: number; periodNum?: number | null; unitPriceVnd: number }[]
): void {
  const byKey = new Map(prices.map((p) => [cartLineKey(p), p.unitPriceVnd]));
  const lines = read();
  const changed = lines.some((l) => {
    const price = byKey.get(cartLineKey(l));
    return price !== undefined && price > 0 && price !== l.unitPriceVnd;
  });
  if (!changed) return;
  write(
    lines.map((l) => {
      const price = byKey.get(cartLineKey(l));
      return price !== undefined && price > 0 ? { ...l, unitPriceVnd: price } : l;
    })
  );
}

export function clearCart(): void {
  write([]);
}

function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null;
      fn();
    }
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(fn);
    window.removeEventListener('storage', onStorage);
  };
}

/** The cart, live across components and tabs. */
export function usePartnerCart(): CartLine[] {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}
