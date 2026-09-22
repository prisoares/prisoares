import {
  CANCEL_FULL_REFUND_HOURS,
  LATE_CANCEL_PENALTY_RATE,
  LATE_CANCEL_REFUND_RATE,
  refundCentsForCancel,
} from '@ludi/shared';

export type CancelPolicyResult = {
  kind: 'cancel' | 'no_show';
  hoursUntilStart: number;
  refundCents: number;
  penaltyCents: number;
  refundRate: number;
  description: string;
};

/**
 * Cancellation / no-show refund rules (MVP).
 * ≥24h before start: 100% refund
 * <24h: 45% penalty / 55% refund
 * no-show: 0 refund
 */
export function computeCancelPolicy(params: {
  startsAt: Date;
  now?: Date;
  paidCents: number;
  kind: 'cancel' | 'no_show';
}): CancelPolicyResult {
  const now = params.now ?? new Date();
  const hoursUntilStart =
    (params.startsAt.getTime() - now.getTime()) / (1000 * 60 * 60);

  const refundCents = refundCentsForCancel({
    paidCents: params.paidCents,
    hoursUntilStart,
    kind: params.kind,
  });
  const penaltyCents = Math.max(0, params.paidCents - refundCents);

  if (params.kind === 'no_show') {
    return {
      kind: 'no_show',
      hoursUntilStart,
      refundCents: 0,
      penaltyCents: params.paidCents,
      refundRate: 0,
      description: 'No-show: sem reembolso',
    };
  }

  if (hoursUntilStart >= CANCEL_FULL_REFUND_HOURS) {
    return {
      kind: 'cancel',
      hoursUntilStart,
      refundCents,
      penaltyCents: 0,
      refundRate: 1,
      description: `Cancelamento ≥${CANCEL_FULL_REFUND_HOURS}h: reembolso 100%`,
    };
  }

  return {
    kind: 'cancel',
    hoursUntilStart,
    refundCents,
    penaltyCents,
    refundRate: LATE_CANCEL_REFUND_RATE,
    description: `Cancelamento <${CANCEL_FULL_REFUND_HOURS}h: multa ${Math.round(LATE_CANCEL_PENALTY_RATE * 100)}% / reembolso ${Math.round(LATE_CANCEL_REFUND_RATE * 100)}%`,
  };
}
