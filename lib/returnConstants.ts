/** Return (RMA) status IDs — mirrors `RETURN_STATUS` in the API server's
 *  src/constants/returnStatus.js. Never hardcode these numbers elsewhere. */
export const RETURN_STATUS = {
  REQUESTED: 1,
  APPROVED: 2,
  REJECTED: 3,
  LABEL_GENERATED: 4,
  RECEIVED: 5,
  REFUNDED: 6,
} as const;

export type ReturnStageKey = 'started' | 'dropoff' | 'refundInitiated' | 'refunded' | 'rejected';

export interface ReturnStage {
  key: ReturnStageKey;
  /** 1-4 for the happy-path timeline, -1 for the rejected (off-path) outcome. */
  stageIndex: number;
  className: string;
}

const STAGE_STARTED: ReturnStage = { key: 'started', stageIndex: 1, className: 'bg-slate-100 text-slate-700' };
const STAGE_DROPOFF: ReturnStage = { key: 'dropoff', stageIndex: 2, className: 'bg-blue-100 text-blue-700' };
const STAGE_REFUND_INITIATED: ReturnStage = { key: 'refundInitiated', stageIndex: 3, className: 'bg-amber-100 text-amber-700' };
const STAGE_REFUNDED: ReturnStage = { key: 'refunded', stageIndex: 4, className: 'bg-emerald-100 text-emerald-700' };
const STAGE_REJECTED: ReturnStage = { key: 'rejected', stageIndex: -1, className: 'bg-rose-100 text-rose-700' };

/** Shipment statuses (from carrier tracking) that mean the package has
 *  actually been scanned by the carrier — i.e. genuinely dropped off, not
 *  just labeled and waiting. */
const CARRIER_SCANNED_STATUSES = new Set(['in_transit', 'out_for_delivery', 'delivered']);

/**
 * Rolls up a return's internal statusId (+ its shipment's carrier status,
 * once a label exists) into the simplified 4-stage timeline customers see:
 * Return Started → Drop Off → Refund Initiated → Refunded. A rejection is a
 * distinct, off-path outcome rather than a broken step in that sequence.
 */
export function getReturnStage(
  statusId: number | null | undefined,
  shipmentStatus?: string | null,
): ReturnStage {
  if (statusId === RETURN_STATUS.REJECTED) return STAGE_REJECTED;
  if (statusId === RETURN_STATUS.REFUNDED) return STAGE_REFUNDED;
  if (statusId === RETURN_STATUS.RECEIVED) return STAGE_REFUND_INITIATED;
  if (shipmentStatus && CARRIER_SCANNED_STATUSES.has(shipmentStatus)) return STAGE_DROPOFF;
  return STAGE_STARTED;
}
