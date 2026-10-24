'use client';

import { useEffect, useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { Loader2, Send } from 'lucide-react';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import {
  createTicket, listCategories, type Category,
} from '@/lib/api/supportTickets';

export function NewTicketForm({ orderId }: { orderId: number | null }) {
  const router = useRouter();
  const [cats, setCats] = useState<Category[]>([]);
  const [category, setCategory] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listCategories().then((d) => setCats(d.categories)).catch(() => setCats([]));
  }, []);

  async function submit() {
    if (sending) return;
    if (!category) { setError('Please pick a category.'); return; }
    if (subject.trim().length < 3) { setError('Please give it a short subject.'); return; }
    if (!body.trim()) { setError('Please describe what happened.'); return; }
    setSending(true);
    setError(null);
    try {
      const data = await createTicket({
        category,
        subject: subject.trim(),
        body:    body.trim(),
        ...(orderId ? { orderId } : {}),
      });
      router.push(`/account/help/${data.ticket.ticketId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not open ticket.');
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumb items={[
        { label: 'Account', href: '/account' },
        { label: 'Need help', href: '/account/help' },
        { label: 'New ticket' },
      ]} />

      <h1 className="mt-4 mb-1 text-2xl font-semibold text-slate-900">Open a support ticket</h1>
      <p className="mb-6 text-sm text-slate-600">
        Pick the closest category, give it a short subject and tell us what happened. Our support team will reply here.
      </p>

      {orderId && (
        <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
          Attached to Order #{orderId}
        </div>
      )}

      <label className="mb-3 block">
        <span className="mb-1 block text-sm text-slate-700">Category</span>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
        >
          <option value="">Select…</option>
          {cats.map((c) => (
            <option key={c.key} value={c.key}>{c.label}</option>
          ))}
        </select>
      </label>

      <label className="mb-3 block">
        <span className="mb-1 block text-sm text-slate-700">Subject</span>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          maxLength={160}
          placeholder="e.g. Package never arrived"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
        />
      </label>

      <label className="mb-3 block">
        <span className="mb-1 block text-sm text-slate-700">What happened?</span>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={8000}
          rows={6}
          placeholder="Describe the problem. Our support team sees exactly what you type here."
          className="w-full resize-y rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
        />
      </label>

      {error && (
        <div role="alert" className="mb-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={() => void submit()}
        disabled={sending}
        className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
      >
        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        Submit ticket
      </button>

      <p className="mt-2 text-[11px] text-slate-500">
        You can attach screenshots or PDFs after the ticket is open.
      </p>
    </main>
  );
}
