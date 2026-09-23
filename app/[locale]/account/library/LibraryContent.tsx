'use client';

/**
 * Buyer Library — every digital purchase, always accessible.
 *
 * Reads from `GET /api/v1/customers/library`. Each item lists its
 * files with a Download button; clicking mints a short-lived signed
 * URL and opens it in a new tab. Software items also render a
 * copy-able licence key.
 *
 * Revoked grants stay visible with an explanatory badge — a buyer
 * whose refund removed access needs to see the record, not have the
 * purchase silently disappear.
 */

import { useCallback, useEffect, useState } from 'react';
import { Download, KeyRound, PackageX, FileText, Video, FileArchive, Loader2 } from 'lucide-react';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { fetchLibrary, requestDownload, type LibraryItem, type LibraryFile } from '@/lib/api/library';

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function iconFor(mime: string) {
  if (mime.startsWith('video/'))       return <Video className="h-4 w-4 text-slate-500" />;
  if (mime.includes('zip') || mime.includes('rar') || mime.includes('7z')) {
    return <FileArchive className="h-4 w-4 text-slate-500" />;
  }
  return <FileText className="h-4 w-4 text-slate-500" />;
}

function subcategoryLabel(id: string | null) {
  switch (id) {
    case 'online_course':    return 'Online course';
    case 'planner_template': return 'Digital planner / template';
    case 'software_app':     return 'Software or app';
    default:                 return 'Digital product';
  }
}

export function LibraryContent() {
  const [items, setItems]       = useState<LibraryItem[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [busyFile, setBusyFile] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await fetchLibrary();
      setItems(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load your library.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const download = useCallback(async (grantId: string, f: LibraryFile) => {
    setBusyFile(f.id);
    try {
      const { url } = await requestDownload(grantId, f.id);
      // Open in a new tab — R2 returns a Content-Disposition: attachment
      // header so the browser downloads instead of navigating.
      window.open(url, '_blank', 'noopener');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start the download.');
    } finally {
      setBusyFile(null);
    }
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <Breadcrumb
        items={[
          { label: 'Account', href: '/account' },
          { label: 'Library' },
        ]}
      />
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Your Library</h1>
        <p className="mt-1 text-sm text-slate-600">
          Every digital product you&rsquo;ve purchased on Cartzii. Files are
          available to download for as long as your account is active.
        </p>
      </header>

      {loading && (
        <div className="flex items-center gap-2 text-slate-500 py-10 justify-center">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading your library…
        </div>
      )}

      {error && !loading && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-600">
          <PackageX className="mx-auto h-8 w-8 mb-2 text-slate-400" />
          You haven&rsquo;t purchased any digital products yet.
        </div>
      )}

      <div className="space-y-4">
        {items.map((it) => (
          <article
            key={it.grantId}
            className={`rounded-xl border ${it.revoked ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-white'} p-5`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  {subcategoryLabel(it.subcategory)} · Order #{it.orderId}
                </p>
                <h2 className="mt-0.5 text-base font-semibold text-slate-900 truncate">
                  {it.productName}
                </h2>
              </div>
              {it.revoked && (
                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-medium text-amber-900">
                  Refunded — access removed
                </span>
              )}
            </div>

            {it.licenseKey && !it.revoked && (
              <div className="mt-3 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                <KeyRound className="h-4 w-4 shrink-0 text-slate-500" />
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] uppercase tracking-wide text-slate-500">License key</p>
                  <code className="mt-0.5 block truncate font-mono text-sm text-slate-900">
                    {it.licenseKey}
                  </code>
                </div>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(it.licenseKey!)}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Copy
                </button>
              </div>
            )}

            {!it.revoked && it.files.length > 0 && (
              <ul className="mt-3 divide-y divide-slate-100 rounded-lg border border-slate-200">
                {it.files.map((f) => (
                  <li key={f.id} className="flex items-center gap-3 p-3">
                    {iconFor(f.mimetype)}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-slate-900">{f.filename}</p>
                      <p className="text-xs text-slate-500">{formatBytes(f.sizeBytes)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => download(it.grantId, f)}
                      disabled={busyFile === f.id}
                      className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                    >
                      {busyFile === f.id
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <Download className="h-4 w-4" />
                      }
                      Download
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {it.revoked && it.revokedReason && (
              <p className="mt-2 text-xs text-amber-900">
                Reason: {it.revokedReason}
              </p>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
