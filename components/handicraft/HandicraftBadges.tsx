import { BadgeCheck, Clock, Hand, Sparkles, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { countryFlag, countryName } from '@/lib/api/handicraft';
import type { HandicraftDetails, ProductSellerBadges } from '@/types';

/**
 * The badges that distinguish a handmade listing.
 *
 * Every one is a real text node with an icon marked decorative — a buyer using
 * a screen reader needs "One of a kind" read out, not an unlabelled icon, and
 * these claims are the reason the item costs what it does.
 */
export function HandicraftBadges({
  handicraft,
  seller,
  size = 'sm',
  className,
}: {
  handicraft: HandicraftDetails;
  seller?: ProductSellerBadges | null;
  size?: 'sm' | 'md';
  className?: string;
}) {
  const text = size === 'md' ? 'text-xs' : 'text-[10px]';
  const pad = size === 'md' ? 'px-2.5 py-1' : 'px-2 py-0.5';
  const icon = size === 'md' ? 'w-3.5 h-3.5' : 'w-3 h-3';

  return (
    <div className={cn('flex flex-wrap items-center gap-1.5', className)}>
      {handicraft.is_handmade && (
        <span className={cn('inline-flex items-center gap-1 rounded-full bg-amber-100 font-bold text-amber-900', text, pad)}>
          <Hand className={icon} aria-hidden="true" /> Handmade
        </span>
      )}

      {handicraft.is_one_of_a_kind && (
        <span className={cn('inline-flex items-center gap-1 rounded-full bg-violet-100 font-bold text-violet-900', text, pad)}>
          <Sparkles className={icon} aria-hidden="true" /> One of a kind
        </span>
      )}

      {/* The lead time is the point — "made to order" without it leaves a
          buyer guessing whether that means days or months. */}
      {handicraft.is_made_to_order && (
        <span className={cn('inline-flex items-center gap-1 rounded-full bg-sky-100 font-bold text-sky-900', text, pad)}>
          <Clock className={icon} aria-hidden="true" />
          Made to order
          {handicraft.production_lead_time_days ? ` · ${handicraft.production_lead_time_days} days` : ''}
        </span>
      )}

      {seller?.artisan_verified && (
        <span className={cn('inline-flex items-center gap-1 rounded-full bg-emerald-100 font-bold text-emerald-900', text, pad)}>
          <BadgeCheck className={icon} aria-hidden="true" /> Verified artisan
        </span>
      )}
    </div>
  );
}

/** Where the craft comes from — flag, region and country. */
export function CraftOrigin({
  handicraft,
  className,
}: {
  handicraft: HandicraftDetails;
  className?: string;
}) {
  const flag = countryFlag(handicraft.craft_origin_country);
  const name = countryName(handicraft.craft_origin_country);
  if (!name) return null;

  return (
    <p className={cn('text-xs text-slate-500', className)}>
      {/* The flag is decoration beside the name, never a replacement for it:
          a flag alone is unreadable to a screen reader and ambiguous to
          anyone who does not recognise it. */}
      {flag && <span aria-hidden="true">{flag} </span>}
      {handicraft.craft_origin_region ? `${handicraft.craft_origin_region}, ` : ''}
      {name}
    </p>
  );
}

/**
 * The import/export caution.
 *
 * Shown when a listed material matched the restricted list at 'warning'
 * severity — the item is legal to sell but may need paperwork at a border, and
 * a buyer should know before it is seized rather than after.
 */
export function RestrictedMaterialNotice({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2.5', className)}>
      <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-900" aria-hidden="true" />
      <p className="text-xs text-amber-900">
        This item contains a material subject to international trade rules. Import or export
        permits may be required depending on your country.
      </p>
    </div>
  );
}
