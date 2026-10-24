'use client';

/**
 * Buyer chat view for one ticket. Agent messages are rendered as
 * "Customer Support"; the real agent name is never served to this page.
 * The composer supports attachments via a two-step presign → direct R2
 * PUT → confirm flow.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useRouter } from '@/i18n/navigation';
import { ArrowLeft, Download, Loader2, Paperclip, Send } from 'lucide-react';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import {
  getTicket, replyTicket, markTicketRead, statusLabel,
  presignAttachment, confirmAttachment, downloadAttachment,
  type Ticket, type TicketMessage,
} from '@/lib/api/supportTickets';

function fmt(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export function TicketThread({ ticketId }: { ticketId: string }) {
  const router = useRouter();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTicket(ticketId);
      setTicket(data.ticket);
      setMessages(data.messages);
      void markTicketRead(ticketId).catch(() => {});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load ticket.');
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  async function submitReply() {
    if (!draft.trim() || sending) return;
    setSending(true);
    setError(null);
    try {
      const data = await replyTicket(ticketId, draft.trim());
      setTicket(data.ticket);
      setMessages((prev) => [...prev, data.message]);
      setDraft('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Message did not send.');
    } finally {
      setSending(false);
    }
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const presigned = await presignAttachment(ticketId, {
        filename:    file.name,
        contentType: file.type || 'application/octet-stream',
        sizeBytes:   file.size,
      });
      const putRes = await fetch(presigned.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
        body: file,
      });
      if (!putRes.ok) throw new Error(`Upload failed (${putRes.status}).`);
      await confirmAttachment(ticketId, {
        r2Key:        presigned.key,
        contentType:  file.type || 'application/octet-stream',
        originalName: file.name,
        body:         draft.trim(),
      });
      setDraft('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Attachment upload failed.');
    } finally {
      setUploading(false);
    }
  }

  async function openAttachment(attachmentId: string) {
    try {
      const data = await downloadAttachment(attachmentId);
      window.open(data.url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not open attachment.');
    }
  }

  const isClosed = ticket && (ticket.status === 'closed' || ticket.status === 'resolved');

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumb items={[
        { label: 'Account', href: '/account' },
        { label: 'Need help', href: '/account/help' },
        { label: 'Ticket' },
      ]} />

      <button
        type="button"
        onClick={() => router.push('/account/help')}
        className="mt-4 mb-4 inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" /> Back to help
      </button>

      {loading && !ticket && (
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500">
          <Loader2 className="inline h-4 w-4 animate-spin mr-2" />
          Loading ticket…
        </div>
      )}

      {error && !ticket && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>
      )}

      {ticket && (
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-3">
            <div>
              <h1 className="text-lg font-semibold text-slate-900">{ticket.subject}</h1>
              <p className="mt-0.5 text-xs text-slate-500 font-mono">{ticket.ticketNumber}</p>
              {ticket.orderId != null && (
                <p className="mt-0.5 text-xs text-slate-500">
                  Related to Order{' '}
                  <Link href={`/account/orders/${ticket.orderId}`} className="underline">#{ticket.orderId}</Link>
                </p>
              )}
            </div>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
              {statusLabel(ticket.status)}
            </span>
          </div>

          <div ref={scrollRef} className="mb-3 max-h-[60vh] space-y-3 overflow-y-auto pr-1">
            {messages.map((m) => {
              const mine = m.senderRole === 'customer';
              return (
                <div key={m.messageId} className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap break-words ${
                    m.senderRole === 'system'
                      ? 'bg-slate-100 italic text-slate-700'
                      : mine
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-900'
                  }`}>
                    {m.body || (m.attachments.length > 0 ? '(attachment)' : '')}
                    {m.attachments.length > 0 && (
                      <div className="mt-2 space-y-1 text-xs">
                        {m.attachments.map((a) => (
                          <button
                            key={a.attachmentId}
                            type="button"
                            onClick={() => void openAttachment(a.attachmentId)}
                            className={`inline-flex items-center gap-1 ${mine ? 'text-white/90 hover:text-white' : 'text-slate-700 hover:text-slate-900'} underline`}
                          >
                            <Download className="h-3 w-3" />
                            {a.originalName} ({Math.round(a.sizeBytes / 1024)} KB)
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
                    <span>{mine ? 'You' : 'Customer Support'}</span>
                    <span>·</span>
                    <span>{fmt(m.createdAt)}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {!isClosed ? (
            <div className="border-t border-slate-200 pt-3">
              {error && (
                <div className="mb-2 rounded-lg border border-red-200 bg-red-50 p-2 text-sm text-red-800">{error}</div>
              )}
              <div className="flex gap-2">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Type a reply…"
                  rows={2}
                  maxLength={8000}
                  disabled={sending || uploading}
                  className="flex-1 resize-none rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
                <div className="flex flex-col gap-2">
                  <input ref={fileRef} type="file" className="hidden" accept="image/*,application/pdf" onChange={(e) => void handleFile(e)} />
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading || sending}
                    title="Attach image or PDF (max 15 MB)"
                    className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                  >
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => void submitReply()}
                    disabled={sending || uploading || draft.trim().length === 0}
                    className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
                  >
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    Send
                  </button>
                </div>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                Our support team usually replies within one business day. Images and PDFs up to 15 MB.
              </p>
            </div>
          ) : (
            <div className="border-t border-slate-200 pt-3 text-sm text-slate-500">
              This ticket is {ticket.status}. Open a new one from the Need Help page if you still need assistance.
            </div>
          )}
        </div>
      )}
    </main>
  );
}
