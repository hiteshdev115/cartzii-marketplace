/**
 * Resolves an API price row into what the storefront displays.
 *
 * WHY THIS EXISTS. The API returns two fields per price row and the storefront
 * previously guessed at their meaning in three separate places — all three
 * assuming `discountprice` was the ORIGINAL compare-at price and `price` was
 * the current one. It is the other way round. The seller portal derives it as:
 *
 *     discountprice = price - (price * discountPct / 100)
 *
 * so `price` is the list price and `discountprice` is the reduced one. Under
 * the old assumption a genuinely discounted variant failed the
 * `discountprice > price` test, the discount was silently dropped, and the
 * variant rendered at full price — indistinguishable from one with no discount
 * at all.
 *
 * Rather than invert the comparison and risk being wrong again, this decides by
 * VALUE: whichever of the two is lower is the sale price. That is correct under
 * either convention, so legacy rows written the old way still render sensibly.
 */

export interface ApiPriceRow {
  price?: string | number | null;
  discountprice?: string | number | null;
  /** Percentage supplied by the API. Preferred over a derived value. */
  discount?: string | number | null;
  currencycode?: string | null;
}

export interface ResolvedPrice {
  /** The compare-at price. Struck through when `salePrice` is set. */
  origPrice: number;
  /** Present only when there is a genuine reduction. */
  salePrice?: number;
  /** 0 when there is no discount. */
  discountPct: number;
  currency?: string;
}

/** Parses a value that may arrive as a string, number, null or "". */
function num(v: string | number | null | undefined): number | undefined {
  if (v === null || v === undefined || v === '') return undefined;
  const n = typeof v === 'number' ? v : parseFloat(v);
  return Number.isFinite(n) ? n : undefined;
}

export function resolvePrice(row?: ApiPriceRow | null): ResolvedPrice {
  if (!row) return { origPrice: 0, discountPct: 0 };

  const a = num(row.price);
  const b = num(row.discountprice);
  const currency = row.currencycode ?? undefined;

  // Only one usable figure — nothing to compare, so nothing is on sale.
  if (a === undefined || b === undefined || b <= 0 || a <= 0 || a === b) {
    return { origPrice: a ?? b ?? 0, discountPct: 0, currency };
  }

  const origPrice = Math.max(a, b);
  const salePrice = Math.min(a, b);

  // Prefer the API's own percentage; derive only when it is absent, so a
  // seller-specified 20% is never silently rewritten to 19% by rounding.
  let discountPct = num(row.discount) ?? 0;
  if (!discountPct && origPrice > 0) {
    discountPct = Math.round(((origPrice - salePrice) / origPrice) * 100);
  }

  return { origPrice, salePrice, discountPct, currency };
}
