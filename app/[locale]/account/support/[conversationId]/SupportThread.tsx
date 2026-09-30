'use client';

/**
 * Customer thread view — reply composer + message list.
 *
 * Bodies come back already redacted from the server. `hasPII` on each
 * message is surfaced next to the timestamp so the shopper knows why
 * they can't paste an email address (and doesn't try again).
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useRouter } from '@/i18n/navigation';
import { ArrowLeft, Loader2, Send, ShieldAlert } from 'lucide-react';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import {
  getSupportConversation,
  markSupportRead,
  replySupportConversation,
  statusLabel,
  type SupportConversation,
  type SupportMessage,
} from '@/lib/api/support';

function fmt(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

export function SupportThread({ conversationId }: { conversationId: string }) {
  const router = useRouter();
  const [conversation, setConversation] = useState<SupportConversation | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  const scrollRef = useRef<HTMLDivElement | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSupportConversation(conversationId);
      setConversation(data.conversation);
      setMessages(data.messages);
      void markSupportRead(conversationId).catch(() => {});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load conversation.');
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  async function submit() {
    if (!draft.trim() || sending) return;
    setSending(true);
    setError(null);
    try {
      const data = await replySupportConversation(conversationId, draft.trim());
      setConversation(data.conversation);
      setMessages((prev) => [...prev, data.message]);
      setDraft('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Message did not send.');
    } finally {
      setSending(false);
    }
  }

  const isClosed = conversation && (conversation.status === 'closed' || conversation.status === 'resolved');
  const myRole = conversation?.callerRole;

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumb
        items={[
          { label: 'Account', href: '/account' },
          { label: 'Support', href: '/account/support' },
          { label: 'Conversation' },
        ]}
      />

      <button
        type="button"
        onClick={() => router.push('/account/support')}
        className="mt-4 mb-4 inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" /> Back to inbox
      </button>

      {loading && !conversation && (
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500">
          <Loader2 className="inline h-4 w-4 animate-spin mr-2" />
          Loading conversation…
        </div>
      )}

      {error && !conversation && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {conversation && (
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-3">
            <div>
              <h1 className="text-lg font-semibold text-slate-900">{conversation.subject}</h1>
              <p className="mt-0.5 text-xs text-slate-500">
                {conversation.orderId
                  ? <>Order <Link href={`/account/orders/${conversation.orderId}`} className="underline">#{conversation.orderId}</Link>{conversation.orderItemId ? ` · Item #${conversation.orderItemId}` : ''}</>
                  : 'General conversation'}
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
              {statusLabel(conversation.status)}
            </span>
          </div>

          <div
            ref={scrollRef}
            className="mb-3 max-h-[60vh] space-y-3 overflow-y-auto pr-1"
          >
            {messages.map((m) => {
              const mine =
                (myRole === 'customer' && m.senderRole === 'customer') ||
                (myRole === 'seller'   && m.senderRole === 'seller');
              return (
                <div
                  key={m.messageId}
                  className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap break-words ${
                      m.senderRole === 'system'
                        ? 'bg-slate-100 text-slate-700 italic'
                        : mine
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-900'
                    }`}
                  >
                    {m.body}
                  </div>
                  <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
                    <span>
                      {m.senderRole === 'customer' ? 'You'
                        : m.senderRole === 'seller' ? 'Seller'
                          : m.senderRole === 'agent' ? 'Cartzii support'
                            : 'System'}
                    </span>
                    <span>·</span>
                    <span>{fmt(m.createdAt)}</span>
                    {m.hasPII && (
                      <>
                        <span>·</span>
                        <span className="inline-flex items-center gap-0.5 text-amber-700">
                          <ShieldAlert className="h-3 w-3" />
                          contact info removed
                        </span>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {!isClosed ? (
            <div className="border-t border-slate-200 pt-3">
              {error && (
                <div className="mb-2 rounded-lg border border-red-200 bg-red-50 p-2 text-sm text-red-800">
                  {error}
                </div>
              )}
              <div className="flex gap-2">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Type a reply…"
                  rows={2}
                  maxLength={8000}
                  disabled={sending}
                  className="flex-1 resize-none rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
                  onClick={() => void submit()}
                  disabled={sending || draft.trim().length === 0}
                >
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Send
                </button>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                To keep the marketplace safe, phone numbers, emails and links
                are removed from every message automatically. Please keep the
                conversation on Cartzii.
              </p>
            </div>
          ) : (
            <div className="border-t border-slate-200 pt-3 text-sm text-slate-500">
              This conversation is {conversation.status}. Open a new one from your order if you need further help.
            </div>
          )}
        </div>
      )}
    </main>
  );
}
