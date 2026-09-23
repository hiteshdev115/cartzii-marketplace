import { Globe2, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { countryFlag, countryName } from '@/lib/api/handicraft';

/**
 * International-listing / DDP badge shown on product cards, detail pages
 * and cart line items.
 *
 * A single, screen-reader-legible chunk of text — "Ships internationally · no
 * duties on delivery" — with the country of origin appended when known. The
 * icon is decorative; the guarantee is what the buyer is buying.
 *
 * `variant='compact'` is the card-corner form; `variant='full'` is the wider
 * two-line explanation used on the product detail and the checkout summary.
 */
export function DdpBadge({
  originCountry,
  variant = 'compact',
  className,
}: {
  originCountry?: string | null;
  variant?: 'compact' | 'full';
  className?: string;
}) {
  const origin = originCountry ?? null;
  const flag = countryFlag(origin);
  const name = origin ? countryName(origin) : null;

  if (variant === 'full') {
    return (
      <div
        className={cn(
          'flex items-start gap-3 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2.5 text-sm text-sky-900',
          className,
        )}
      >
        <Shield className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" aria-hidden="true" />
        <div>
          <div className="font-semibold">
            {name ? (
              <>
                {flag ? <span aria-hidden="true">{flag} </span> : null}
                Ships from {name}
              </>
            ) : (
              'Ships internationally'
            )}
          </div>
          <div className="text-xs text-sky-800">
            Duties and taxes are included in the product price. No additional charges at delivery.
          </div>
        </div>
      </div>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-900',
        className,
      )}
    >
      <Globe2 className="h-3 w-3" aria-hidden="true" />
      {name ? (
        <span>Made in {name}</span>
      ) : (
        <span>International</span>
      )}
      <span aria-hidden="true">·</span>
      <span>no duties on delivery</span>
    </span>
  );
}
