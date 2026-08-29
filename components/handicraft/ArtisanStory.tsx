import { Hand, MapPin, Layers, Award, Clock } from 'lucide-react';
import { countryFlag, countryName } from '@/lib/api/handicraft';
import { HandicraftBadges, RestrictedMaterialNotice } from './HandicraftBadges';
import type { HandicraftDetails, ProductSellerBadges } from '@/types';

/**
 * The maker behind the piece.
 *
 * Rendered on the product page above the ordinary tabs, because on a handmade
 * item this IS the product information — the technique, the materials and the
 * person are why it costs more than the machine-made equivalent.
 *
 * Only shown for a handicraft listing; a general product has no detail object
 * and this component never mounts.
 */
export function ArtisanStory({
  handicraft,
  seller,
}: {
  handicraft: HandicraftDetails;
  seller?: ProductSellerBadges | null;
}) {
  const origin = countryName(handicraft.craft_origin_country);
  const flag = countryFlag(handicraft.craft_origin_country);

  const facts = [
    handicraft.craft_technique && { icon: Hand, label: 'Technique', value: handicraft.craft_technique },
    origin && {
      icon: MapPin,
      label: 'Origin',
      value: `${handicraft.craft_origin_region ? `${handicraft.craft_origin_region}, ` : ''}${origin}`,
    },
    handicraft.material_used.length > 0 && {
      icon: Layers,
      label: 'Materials',
      value: handicraft.material_used.join(', '),
    },
    handicraft.certifications.length > 0 && {
      icon: Award,
      label: 'Certifications',
      value: handicraft.certifications.join(', '),
    },
    handicraft.is_made_to_order && handicraft.production_lead_time_days && {
      icon: Clock,
      label: 'Made to order',
      value: `Ready in about ${handicraft.production_lead_time_days} days`,
    },
  ].filter(Boolean) as { icon: typeof Hand; label: string; value: string }[];

  return (
    <section
      className="mt-10 overflow-hidden rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50"
      aria-labelledby="artisan-story-heading"
    >
      <div className="p-6 sm:p-8">
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-amber-800">
          Handmade
        </p>
        <h2 id="artisan-story-heading" className="text-2xl font-extrabold text-slate-900">
          {handicraft.artisan_name}
        </h2>

        {origin && (
          <p className="mt-1 text-sm text-slate-600">
            {flag && <span aria-hidden="true">{flag} </span>}
            {handicraft.craft_origin_region ? `${handicraft.craft_origin_region}, ` : ''}
            {origin}
          </p>
        )}

        <HandicraftBadges handicraft={handicraft} seller={seller} size="md" className="mt-4" />

        {handicraft.artisan_story && (
          <p className="mt-5 max-w-2xl whitespace-pre-line text-[15px] leading-relaxed text-slate-700">
            {handicraft.artisan_story}
          </p>
        )}

        {facts.length > 0 && (
          <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {facts.map((fact) => (
              <div key={fact.label} className="flex items-start gap-2.5">
                <fact.icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-700" aria-hidden="true" />
                <div className="min-w-0">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {fact.label}
                  </dt>
                  <dd className="text-sm capitalize text-slate-800">{fact.value}</dd>
                </div>
              </div>
            ))}
          </dl>
        )}

        {/* A seller shipping from abroad changes delivery expectations, so it
            is stated rather than left for the buyer to infer from the origin. */}
        {seller?.is_international_seller && seller.seller_country && (
          <p className="mt-5 text-sm text-slate-600">
            <span aria-hidden="true">{countryFlag(seller.seller_country)} </span>
            Ships from {countryName(seller.seller_country)} — international delivery times apply.
          </p>
        )}

        {handicraft.has_restricted_material && <RestrictedMaterialNotice className="mt-5" />}
      </div>
    </section>
  );
}
