'use client';

/**
 * The buyer's "Need Help" landing — a list of their support tickets with
 * status and a prominent CTA to open a new one.
 */

import { useCallback, useEffect, useState } from 'react';
import { Link } from '@/i18n/navigation';
import { LifeBuoy, Loader2, Plus, RefreshCcw } from 'lucide-react';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { listMyTickets, statusLabel, type Ticket } from '@/lib/api/supportTickets';

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

function statusTone(s: Ticket['status']): string {
  switch (s) {
    case 'awaiting_customer': return 'bg-red-100 text-red-800';
    case 'awaiting_support':  return 'bg-emerald-100 text-emerald-800';
    case 'resolved':
    case 'closed':            return 'bg-slate-200 text-slate-700';
    default:                  return 'bg-sky-100 text-sky-800';
  }
}

export function HelpInbox() {
  const [rows, setRows] = useState<Ticket[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listMyTickets({ limit: 50 });
      setRows(data.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load tickets.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumb items={[{ label: 'Account', href: '/account' }, { label: 'Need help' }]} />

      <div className="mt-4 mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 flex items-center gap-2">
            <LifeBuoy className="h-6 w-6 text-primary" /> Need help?
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Open a ticket and our support team will reply here. You&apos;ll see every reply in one place — no email ping-pong.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
            Refresh
          </button>
          <Link
            href="/account/help/new"
            className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" /> New ticket
          </Link>
        </div>
      </div>

      {error && (
        <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {loading && rows == null && (
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500">
          <Loader2 className="inline h-4 w-4 animate-spin mr-2" />
          Loading tickets…
        </div>
      )}

      {rows != null && rows.length === 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          <LifeBuoy className="mx-auto mb-2 h-6 w-6 text-slate-400" />
          You don&apos;t have any tickets yet. Open one to start a conversation with support.
          <div className="mt-4">
            <Link
              href="/account/help/new"
              className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              <Plus className="h-4 w-4" /> New ticket
            </Link>
          </div>
        </div>
      )}

      {rows != null && rows.length > 0 && (
        <div className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
          {rows.map((t) => (
            <Link
              key={t.ticketId}
              href={`/account/help/${t.ticketId}`}
              className="flex items-start gap-4 px-4 py-3 hover:bg-slate-50"
            >
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs text-slate-500">{t.ticketNumber}</span>
                  <span className="truncate text-sm font-medium text-slate-900">{t.subject}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${statusTone(t.status)}`}>
                    {statusLabel(t.status)}
                  </span>
                </div>
                {t.orderId != null && (
                  <div className="mt-0.5 text-xs text-slate-500">Order #{t.orderId}</div>
                )}
              </div>
              <div className="shrink-0 text-right text-xs text-slate-500">
                {timeAgo(t.lastMessageAt)}
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
