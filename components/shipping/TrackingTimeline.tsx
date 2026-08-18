'use client';

import { CheckCircle2, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { STATUS_BADGE_MAP, type ShipmentStatus } from '@/lib/shippingConstants';
import type { TrackingEvent } from '@/lib/shippingApi';

function eventStatusLabel(status: string): string {
  return STATUS_BADGE_MAP[status as ShipmentStatus]?.label ?? status.replace(/_/g, ' ');
}

interface TrackingTimelineProps {
  events: TrackingEvent[];
  currentStatus: string;
}

function formatEventTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

const TERMINAL_STATUSES = new Set(['delivered', 'return_to_sender', 'failure']);

/**
 * Reduces the event log to one entry per stage per place.
 *
 * These events are lifecycle STAGES from a fixed vocabulary, not per-facility
 * carrier scans — every repeat of "in transit" at the same location carries the
 * same generic description and tells the customer nothing new. Webhook replays
 * (delivery is at-least-once) and repeated QA runs turned that into a timeline
 * that appeared to show each status two or three times.
 *
 * Keyed on status AND location, so a parcel genuinely scanned in two cities
 * still shows both. Expects newest-first input and keeps the newest of each
 * group, which is the occurrence the customer cares about.
 */
function dedupeStages(events: TrackingEvent[]): TrackingEvent[] {
  const seen = new Set<string>();
  return events.filter((event) => {
    const key = `${event.status}::${event.location ?? ''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function TrackingTimeline({ events, currentStatus }: TrackingTimelineProps) {
  const sorted = [...events].sort(
    (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
  );

  const timeline = dedupeStages(sorted);

  return (
    <ol className="relative space-y-0">
      {timeline.map((event, idx) => {
        const isFirst = idx === 0;
        const isDone = TERMINAL_STATUSES.has(currentStatus) || !isFirst;

        return (
          <li key={event.eventId} className="flex gap-4 pb-6 last:pb-0">
            {/* Timeline spine */}
            <div className="flex flex-col items-center shrink-0">
              <span
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-full border-2',
                  isDone
                    ? 'border-emerald-400 bg-emerald-50 text-emerald-600'
                    : isFirst
                      ? 'border-primary bg-primary text-white'
                      : 'border-slate-300 bg-white text-slate-400',
                )}
              >
                {isDone ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : isFirst ? (
                  <Circle className="h-3.5 w-3.5 fill-white" />
                ) : (
                  <Circle className="h-3.5 w-3.5" />
                )}
              </span>
              {idx < timeline.length - 1 && (
                <span className="mt-1 flex-1 w-0.5 bg-slate-200" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 pt-0.5">
              <p className="text-sm font-medium text-slate-900 capitalize">
                {eventStatusLabel(event.status)}
              </p>
              <p className="text-sm text-slate-600">{event.description}</p>
              {event.location && (
                <p className="text-xs text-slate-500 mt-0.5">{event.location}</p>
              )}
              <p className="text-xs text-slate-400 mt-1">
                {formatEventTime(event.occurredAt)}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
