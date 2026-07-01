'use client';

import { CheckCircle2, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TrackingEvent } from '@/lib/shippingApi';

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

export function TrackingTimeline({ events, currentStatus }: TrackingTimelineProps) {
  const sorted = [...events].sort(
    (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
  );

  return (
    <ol className="relative space-y-0">
      {sorted.map((event, idx) => {
        const isFirst = idx === 0;
        const isDone = TERMINAL_STATUSES.has(currentStatus) || !isFirst;

        return (
          <li key={event.eventId} className="flex gap-4 pb-6 last:pb-0">
            {/* Timeline spine */}
            <div className="flex flex-col items-center shrink-0">
              <span
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-full border-2',
                  isFirst
                    ? 'border-primary bg-primary text-white'
                    : isDone
                      ? 'border-emerald-400 bg-emerald-50 text-emerald-600'
                      : 'border-slate-300 bg-white text-slate-400',
                )}
              >
                {isFirst ? (
                  <Circle className="h-3.5 w-3.5 fill-white" />
                ) : isDone ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  <Circle className="h-3.5 w-3.5" />
                )}
              </span>
              {idx < sorted.length - 1 && (
                <span className="mt-1 flex-1 w-0.5 bg-slate-200" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 pt-0.5">
              <p className="text-sm font-medium text-slate-900 capitalize">
                {event.status.replace(/_/g, ' ')}
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
