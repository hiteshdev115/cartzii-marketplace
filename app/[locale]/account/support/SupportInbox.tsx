'use client';

/**
 * Customer support inbox — every conversation the shopper has opened with
 * a seller. Phase 1 is flat: newest first, no folders. New conversations
 * are opened from an order's detail page (Phase 1 UI slice adds the button
 * there); this list is the read-back view.
 */

import { useCallback, useEffect, useState } from 'react';
import { Link } from '@/i18n/navigation';
import { Loader2, MessageSquare, RefreshCcw } from 'lucide-react';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import {
  listSupportConversations,
  statusLabel,
  type SupportConversation,
} from '@/lib/api/support';

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min  = Math.floor(diff / 60_000);
  if (min < 1)  return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24)  return `${hr}h ago`;
  const d = Math.floor(hr / 24);
  return d < 30 ? `${d}d ago` : new Date(iso).toLocaleDateString();
}

function statusTone(s: SupportConversation['status']): string {
  switch (s) {
    case 'waiting_customer': return 'bg-red-100 text-red-800';
    case 'waiting_seller':   return 'bg-emerald-100 text-emerald-800';
    case 'waiting_platform': return 'bg-amber-100 text-amber-800';
    case 'resolved':
    case 'closed':           return 'bg-slate-200 text-slate-700';
    default:                 return 'bg-sky-100 text-sky-800';
  }
}

export function SupportInbox() {
  const [rows, setRows] = useState<SupportConversation[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listSupportConversations({ limit: 50 });
      setRows(data.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load conversations.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumb items={[{ label: 'Account', href: '/account' }, { label: 'Support' }]} />
      <div className="mb-6 mt-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Support</h1>
          <p className="mt-1 text-sm text-slate-600">
            Messages between you and the sellers you have ordered from.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
          Refresh
        </button>
      </div>

      {error && (
        <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {loading && rows == null && (
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500">
          <Loader2 className="inline h-4 w-4 animate-spin mr-2" />
          Loading conversations…
        </div>
      )}

      {rows != null && rows.length === 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          <MessageSquare className="mx-auto mb-2 h-6 w-6 text-slate-400" />
          You have no support conversations yet. To contact a seller, open the
          order detail page and use the &quot;Message seller&quot; button.
        </div>
      )}

      {rows != null && rows.length > 0 && (
        <div className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
          {rows.map((c) => (
            <Link
              key={c.conversationId}
              href={`/account/support/${c.conversationId}`}
              className="flex items-start gap-4 px-4 py-3 hover:bg-slate-50"
            >
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="truncate text-sm font-medium text-slate-900">
                    {c.subject}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${statusTone(c.status)}`}>
                    {statusLabel(c.status)}
                  </span>
                </div>
                <div className="mt-0.5 text-xs text-slate-500">
                  {c.orderId
                    ? `Order #${c.orderId}${c.orderItemId ? ` · Item #${c.orderItemId}` : ''}`
                    : 'General'}
                </div>
              </div>
              <div className="shrink-0 text-right text-xs text-slate-500">
                {timeAgo(c.lastMessageAt)}
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
