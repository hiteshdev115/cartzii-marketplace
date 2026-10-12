import { api } from './client';

export type DisputeRole = 'buyer' | 'seller' | 'admin' | 'system';

export interface DisputeMessage {
  messageId: number;
  authorRole: DisputeRole;
  authorId: number | null;
  body: string;
  createdAt: string;
}

export interface Dispute {
  disputeId: number;
  returnId: number;
  orderId: number;
  userId: number;
  sellerId: number;
  openedByRole: DisputeRole;
  status: 'open' | 'resolved';
  resolution: string | null;
  resolvedNote: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  messages: DisputeMessage[];
}

interface DisputesListResponse {
  success?: boolean;
  disputes: Dispute[];
}

interface DisputeDetailResponse {
  success?: boolean;
  dispute: Dispute;
}

/**
 * Looks up the dispute attached to a given return, if any. The backend
 * exposes list-by-user — the one dispute per return is a filter here, not
 * a dedicated endpoint, so the buyer side doesn't need a `returnid` lookup
 * API in addition to it.
 */
export async function getDisputeForReturn(returnId: number): Promise<Dispute | null> {
  const res = await api.get<DisputesListResponse>('/api/v1/disputes', { skipGuestToken: true });
  const match = (res.disputes ?? []).find((d) => d.returnId === returnId);
  return match ?? null;
}

export async function postDisputeMessage(disputeId: number, body: string): Promise<Dispute> {
  const res = await api.post<DisputeDetailResponse>(
    `/api/v1/disputes/${disputeId}/messages`,
    { body },
    { skipGuestToken: true },
  );
  return res.dispute;
}
