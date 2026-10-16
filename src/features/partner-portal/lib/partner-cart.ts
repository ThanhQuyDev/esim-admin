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
};

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
  const existing = lines.find((l) => l.planId === line.planId);
  write(
    existing
      ? lines.map((l) =>
          l.planId === line.planId ? { ...line, quantity: l.quantity + line.quantity } : l
        )
      : [...lines, line]
  );
}

export function setCartQuantity(planId: number, quantity: number): void {
  write(
    quantity > 0
      ? read().map((l) => (l.planId === planId ? { ...l, quantity } : l))
      : read().filter((l) => l.planId !== planId)
  );
}

export function removeFromCart(planId: number): void {
  write(read().filter((l) => l.planId !== planId));
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
