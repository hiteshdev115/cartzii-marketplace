'use client';

import { useEffect, useState } from 'react';

/** setTimeout overflows past this and fires immediately, so long waits re-arm. */
const MAX_TIMEOUT_MS = 2_147_483_000;

function windowOpen(endsAt?: string): boolean {
  if (!endsAt) return false;
  const ends = new Date(endsAt).getTime();
  return Number.isFinite(ends) && ends > Date.now();
}

/**
 * Whether a deal window is still open, re-rendering the moment it closes.
 *
 * Needed because a card can outlive its own deal: it was fetched while the
 * promotion was running, and the shopper is still looking at it minutes later.
 * Without this the countdown reached zero and sat there reading "Expired",
 * which tells a shopper the product is over rather than that the promotion is.
 *
 * One timer fired at the expiry, not a per-second poll — the countdown already
 * ticks for display, and this only needs to know once.
 */
export function useDealActive(endsAt?: string): boolean {
  const [active, setActive] = useState(() => windowOpen(endsAt));

  useEffect(() => {
    const open = windowOpen(endsAt);

    // Deferred by a tick rather than called inline: setting state synchronously
    // inside an effect triggers a cascading render.
    const sync = setTimeout(() => setActive(open), 0);

    if (!open || !endsAt) {
      return () => clearTimeout(sync);
    }

    const remaining = new Date(endsAt).getTime() - Date.now();
    const timer = setTimeout(
      () => setActive(false),
      Math.min(remaining, MAX_TIMEOUT_MS),
    );

    return () => {
      clearTimeout(sync);
      clearTimeout(timer);
    };
  }, [endsAt]);

  return active;
}
