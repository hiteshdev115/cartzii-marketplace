'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, Send } from 'lucide-react';

import {
  getDisputeForReturn,
  postDisputeMessage,
  type Dispute,
} from '@/lib/api/disputes';

const AUTHOR_LABEL: Record<string, string> = {
  buyer:  'You',
  seller: 'Seller',
  admin:  'Cartzii Support',
  system: 'System',
};

/**
 * Chat thread attached to a rejected return.
 *
 * Fetches the dispute by return id; renders nothing while loading and nothing
 * if there is no dispute (the common case: a return that was approved and is
 * in-progress has no dispute). On a rejected return the thread exists and
 * the buyer can post into it.
 *
 * The super admin reads and posts into the same table via a separate
 * admin-authenticated endpoint — this file never calls that endpoint, so a
 * leaked customer token is only able to see the buyer's own disputes.
 */
export function DisputeThread({ returnId }: { returnId: number }) {
  const [dispute, setDispute] = useState<Dispute | null>(null);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft]     = useState('');
  const [posting, setPosting] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const d = await getDisputeForReturn(returnId);
      setDispute(d);
    } catch (_err) {
      setDispute(null);
    } finally {
      setLoading(false);
    }
  }, [returnId]);

  useEffect(() => { void load(); }, [load]);

  async function send() {
    if (!dispute || posting) return;
    const text = draft.trim();
    if (!text) return;
    setPosting(true);
    setError(null);
    try {
      const updated = await postDisputeMessage(dispute.disputeId, text);
      setDispute(updated);
      setDraft('');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not send your message';
      setError(msg);
    } finally {
      setPosting(false);
    }
  }

  if (loading || !dispute) return null;

  const resolved = dispute.status === 'resolved';

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-slate-900">Dispute conversation</h2>
      <p className="mt-1 text-sm text-slate-500">
        Visible to the seller and to Cartzii. Cartzii will step in if you cannot settle it directly.
      </p>

      <div className="mt-4 space-y-2">
        {dispute.messages.map((m) => (
          <div
            key={m.messageId}
            className={
              'rounded-md border p-3 text-sm ' +
              (m.authorRole === 'buyer'
                ? 'border-primary/30 bg-primary/5'
                : m.authorRole === 'admin'
                  ? 'border-blue-200 bg-blue-50'
                  : m.authorRole === 'system'
                    ? 'border-slate-200 bg-slate-50 text-slate-600'
                    : 'border-slate-200 bg-white')
            }
          >
            <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
              <span className="font-medium text-slate-700">
                {AUTHOR_LABEL[m.authorRole] ?? m.authorRole}
              </span>
              <span>{new Date(m.createdAt).toLocaleString()}</span>
            </div>
            <div className="whitespace-pre-wrap">{m.body}</div>
          </div>
        ))}
      </div>

      {resolved ? (
        <p className="mt-4 rounded border-l-4 border-emerald-500 bg-emerald-50/40 p-3 text-sm">
          This dispute has been resolved by Cartzii. Thread is closed to replies.
        </p>
      ) : (
        <div className="mt-4 space-y-2">
          <textarea
            className="w-full rounded border border-slate-300 bg-white p-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            placeholder="Explain your side — the seller and Cartzii will see this."
          />
          {error && <p className="text-xs text-rose-600">{error}</p>}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={send}
              disabled={posting || !draft.trim()}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {posting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
