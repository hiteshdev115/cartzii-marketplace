/**
 * Google Search Console / Merchant Center verification responder.
 *
 * Reachable at `/google<token>.html` via a rewrite from `next.config.ts`.
 * The expected token is set per deployment with
 * `NEXT_PUBLIC_GOOGLE_SITE_VERIFY` so the QA and prod slots carry their
 * own tokens without a rebuild of the shared image.
 *
 * The body Google is looking for is the literal filename it generated —
 * e.g. `google-site-verification: googleABC123.html`. Anything else and
 * the "Verify" button in Search Console fails silently.
 */

import { NextResponse } from 'next/server';

interface Context {
  params: Promise<{ token: string }>;
}

export async function GET(_request: Request, context: Context): Promise<Response> {
  const expected = (process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFY ?? '').trim();
  if (!expected) {
    return new NextResponse('not configured', { status: 404 });
  }

  const { token } = await context.params;
  const requested = String(token || '').toLowerCase();
  const expectedFilename = `google${expected.toLowerCase()}`;

  // Reject any probe that is not the exact filename Google issued for this
  // deployment. A match on substring would quietly verify someone else's
  // token.
  if (requested !== expectedFilename) {
    return new NextResponse('not found', { status: 404 });
  }

  return new NextResponse(`google-site-verification: ${expectedFilename}.html`, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      // Google re-polls on verification; a cached stale body breaks the
      // retry if the token ever rotates.
      'Cache-Control': 'no-store',
    },
  });
}
