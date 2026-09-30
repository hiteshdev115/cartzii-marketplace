import { api } from './client';

/**
 * Support conversations — Phase 1 client (customer side).
 *
 * Mirrors the seller-portal service. The server identifies the caller from
 * the JWT and refuses access to threads the caller is not a participant in.
 */

interface ApiEnvelope<T> {
  success?: boolean | number;
  data?: T;
  message?: string;
}

function unwrap<T>(response: T | ApiEnvelope<T>): T {
  if (response && typeof response === 'object' && 'data' in response) {
    return (response as ApiEnvelope<T>).data as T;
  }
  return response as T;
}

export type SupportStatus =
  | 'open'
  | 'waiting_seller'
  | 'waiting_customer'
  | 'waiting_platform'
  | 'resolved'
  | 'closed';

export type SupportRole = 'customer' | 'seller' | 'agent' | 'system';

export interface SupportConversation {
  conversationId:     string;
  kind:               'customer_seller' | 'customer_platform' | 'seller_platform';
  orderId:            number | null;
  orderItemId:        number | null;
  customerId:         number | null;
  sellerId:           number | null;
  subject:            string;
  status:             SupportStatus;
  priority:           'normal' | 'high';
  escalated:          boolean;
  firstResponseDueAt: string | null;
  lastMessageAt:      string;
  createdAt:          string;
  updatedAt:          string;
  callerRole?:        SupportRole;
}

export interface SupportMessage {
  messageId:        string;
  conversationId:   string;
  senderRole:       SupportRole;
  senderUserId:     number | null;
  senderSellerId:   number | null;
  body:             string;
  hasPII:           boolean;
  readAtByCustomer: string | null;
  readAtBySeller:   string | null;
  createdAt:        string;
}

export async function listSupportConversations(
  params: { limit?: number; cursor?: string | null } = {},
): Promise<{ items: SupportConversation[]; nextCursor: string | null }> {
  const qs = new URLSearchParams();
  if (params.limit)  qs.set('limit',  String(params.limit));
  if (params.cursor) qs.set('cursor', params.cursor);
  const url = `/api/v1/support/conversations${qs.toString() ? `?${qs}` : ''}`;
  const res = await api.get<ApiEnvelope<{ items: SupportConversation[]; nextCursor: string | null }>>(url);
  return unwrap(res);
}

export async function getSupportConversation(id: string): Promise<{
  conversation: SupportConversation;
  messages: SupportMessage[];
}> {
  const res = await api.get<ApiEnvelope<{ conversation: SupportConversation; messages: SupportMessage[] }>>(
    `/api/v1/support/conversations/${id}`,
  );
  return unwrap(res);
}

export async function createSupportConversation(payload: {
  sellerId:     number;
  subject:      string;
  body:         string;
  orderId?:     number;
  orderItemId?: number;
}): Promise<{ conversation: SupportConversation; message: SupportMessage }> {
  const res = await api.post<ApiEnvelope<{ conversation: SupportConversation; message: SupportMessage }>>(
    '/api/v1/support/conversations',
    payload,
  );
  return unwrap(res);
}

export async function replySupportConversation(
  id: string,
  body: string,
): Promise<{ conversation: SupportConversation; message: SupportMessage }> {
  const res = await api.post<ApiEnvelope<{ conversation: SupportConversation; message: SupportMessage }>>(
    `/api/v1/support/conversations/${id}/messages`,
    { body },
  );
  return unwrap(res);
}

export async function markSupportRead(id: string): Promise<void> {
  await api.post(`/api/v1/support/conversations/${id}/read`, {});
}

export function statusLabel(s: SupportStatus): string {
  const map: Record<SupportStatus, string> = {
    open:             'Open',
    waiting_seller:   'Waiting on seller',
    waiting_customer: 'Waiting on you',
    waiting_platform: 'Waiting on Cartzii',
    resolved:         'Resolved',
    closed:           'Closed',
  };
  return map[s] ?? s;
}
