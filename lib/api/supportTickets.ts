import { api } from './client';

/**
 * Customer-facing support-ticket client. The server strips agent
 * identity before sending — the buyer sees the label "Customer Support"
 * instead of the agent's name.
 */

interface ApiEnvelope<T> { success?: boolean | number; data?: T; message?: string }
function unwrap<T>(res: T | ApiEnvelope<T>): T {
  if (res && typeof res === 'object' && 'data' in res) return (res as ApiEnvelope<T>).data as T;
  return res as T;
}

export type TicketStatus = 'open' | 'awaiting_customer' | 'awaiting_support' | 'resolved' | 'closed';

export interface Ticket {
  ticketId:      string;
  ticketNumber:  string;
  customerId:    number;
  category:      string;
  subject:       string;
  status:        TicketStatus;
  orderId:       number | null;
  lastMessageAt: string;
  createdAt:     string;
  updatedAt:     string;
}

export interface TicketMessage {
  messageId:  string;
  ticketId:   string;
  senderRole: 'customer' | 'support' | 'system';
  body:       string;
  createdAt:  string;
  attachments: Array<{
    attachmentId: string;
    contentType:  string;
    sizeBytes:    number;
    originalName: string;
  }>;
}

export interface Category { key: string; label: string }

export async function listCategories(): Promise<{ categories: Category[] }> {
  const res = await api.get<ApiEnvelope<{ categories: Category[] }>>('/api/v1/support/categories');
  return unwrap(res);
}

export async function listMyTickets(params: { limit?: number; cursor?: string | null } = {}) {
  const qs = new URLSearchParams();
  if (params.limit)  qs.set('limit',  String(params.limit));
  if (params.cursor) qs.set('cursor', params.cursor);
  const url = `/api/v1/support/tickets${qs.toString() ? `?${qs}` : ''}`;
  const res = await api.get<ApiEnvelope<{ items: Ticket[]; nextCursor: string | null }>>(url);
  return unwrap(res);
}

export async function getTicket(id: string) {
  const res = await api.get<ApiEnvelope<{ ticket: Ticket; messages: TicketMessage[] }>>(
    `/api/v1/support/tickets/${id}`,
  );
  return unwrap(res);
}

export async function createTicket(payload: {
  category: string; subject: string; body: string; orderId?: number;
}) {
  const res = await api.post<ApiEnvelope<{ ticket: Ticket; message: TicketMessage }>>(
    '/api/v1/support/tickets', payload,
  );
  return unwrap(res);
}

export async function replyTicket(id: string, body: string) {
  const res = await api.post<ApiEnvelope<{ ticket: Ticket; message: TicketMessage }>>(
    `/api/v1/support/tickets/${id}/messages`, { body },
  );
  return unwrap(res);
}

export async function markTicketRead(id: string) {
  await api.post(`/api/v1/support/tickets/${id}/read`, {});
}

export async function presignAttachment(ticketId: string, payload: {
  filename: string; contentType: string; sizeBytes: number;
}) {
  const res = await api.post<ApiEnvelope<{ key: string; uploadUrl: string; expiresAt: string }>>(
    `/api/v1/support/tickets/${ticketId}/attachments/presign`, payload,
  );
  return unwrap(res);
}

export async function confirmAttachment(ticketId: string, payload: {
  r2Key: string; contentType: string; originalName: string;
  attachToMessageId?: string | null; body?: string;
}) {
  const res = await api.post<ApiEnvelope<{
    attachmentId: string; messageId: string;
    contentType: string; sizeBytes: number; originalName: string;
  }>>(`/api/v1/support/tickets/${ticketId}/attachments/confirm`, payload);
  return unwrap(res);
}

export async function downloadAttachment(attachmentId: string) {
  const res = await api.get<ApiEnvelope<{ url: string; expiresAt: string }>>(
    `/api/v1/support/attachments/${attachmentId}/download`,
  );
  return unwrap(res);
}

export function statusLabel(s: TicketStatus): string {
  const map: Record<TicketStatus, string> = {
    open:              'Open',
    awaiting_customer: 'Awaiting your reply',
    awaiting_support:  'With support',
    resolved:          'Resolved',
    closed:            'Closed',
  };
  return map[s] ?? s;
}
