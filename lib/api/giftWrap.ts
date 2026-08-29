import { api } from './client';

/**
 * The gift-wrap add-on's price, as the platform has it set.
 *
 * Read from the server rather than hard-coded, because it is the SAME value
 * the order endpoint charges — a number duplicated in the client would show a
 * customer one price and take another the day someone changed it.
 *
 * Zero means the add-on is withdrawn and must not be offered.
 */
export interface GiftWrapPolicy {
  priceCents: number;
  available: boolean;
}

const UNAVAILABLE: GiftWrapPolicy = { priceCents: 0, available: false };

export async function fetchGiftWrapPolicy(): Promise<GiftWrapPolicy> {
  try {
    const response = await api.get<unknown>('/api/v1/handicraft/policy');
    const envelope = response as { data?: { giftWrapPriceCents?: number } };
    const cents = Number(envelope?.data?.giftWrapPriceCents);
    if (!Number.isFinite(cents) || cents <= 0) return UNAVAILABLE;
    return { priceCents: Math.round(cents), available: true };
  } catch {
    // Not offered rather than offered-at-an-unknown-price: charging for
    // something whose price we could not read is the worse failure.
    return UNAVAILABLE;
  }
}
