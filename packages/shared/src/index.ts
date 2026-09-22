/** Booking state machine (MVP). */
export const BOOKING_STATUSES = [
  'requested',
  'hold_15m',
  'accepted',
  'payment_pending',
  'confirmed',
  'expired',
  'cancelled',
  'no_show',
] as const;

export type BookingStatus = (typeof BOOKING_STATUSES)[number];

/** Hold window waiting for partner acceptance. */
export const HOLD_MINUTES = 15;

/** Pay at least this many hours before the slot start. */
export const PAYMENT_DEADLINE_HOURS_BEFORE = 24;

/** Marketplace fees. */
export const COMMISSION_RATE = 0.05;
export const MONTHLY_MAP_FEE_GMV_RATE = 0.01;

/** Cancel / refund policy. */
export const CANCEL_FULL_REFUND_HOURS = 24;
export const LATE_CANCEL_PENALTY_RATE = 0.45;
export const LATE_CANCEL_REFUND_RATE = 0.55;

export type AccountRole = 'user' | 'partner';

export const CITY = {
  slug: 'porto-alegre',
  name: 'Porto Alegre',
  state: 'RS',
  country: 'BR',
  center: { lat: -30.0346, lng: -51.2177 },
} as const;

export const BRAND = {
  name: 'LUDI',
  tagline: 'Reserve horários com extrema facilidade!',
  colors: {
    teal: '#0D9488',
    tealDark: '#0F766E',
    blue: '#0284C7',
    navy: '#0C4A6E',
    sand: '#F0FDFA',
    white: '#FFFFFF',
    ink: '#0F172A',
    muted: '#64748B',
  },
} as const;

export interface SportDto {
  id: string;
  slug: string;
  name: string;
  iconKey: string;
}

export interface VenueDto {
  id: string;
  slug: string;
  name: string;
  address: string;
  neighborhood: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
  minPriceCents: number;
  sports: string[];
  photoUrls: string[];
}

export interface CourtDto {
  id: string;
  venueId: string;
  name: string;
  sportSlug: string;
  priceCents: number;
}

export interface BookingDto {
  id: string;
  status: BookingStatus;
  venueName: string;
  courtName: string;
  startsAt: string;
  endsAt: string;
  holdExpiresAt?: string | null;
  paymentDueAt?: string | null;
  priceCents: number;
  commissionCents: number;
  payment?: {
    status: string;
    pixCopyPaste?: string | null;
    amountCents: number;
  } | null;
}

export function commissionCentsFromPrice(priceCents: number): number {
  return Math.round(priceCents * COMMISSION_RATE);
}

export function paymentDueAtFromStart(startsAt: Date): Date {
  return new Date(
    startsAt.getTime() - PAYMENT_DEADLINE_HOURS_BEFORE * 60 * 60 * 1000,
  );
}

/**
 * Refund amount after cancel/no-show given paid amount and hours until start.
 * No-show: 0. Cancel ≥24h: 100%. Cancel <24h: 55%.
 */
export function refundCentsForCancel(params: {
  paidCents: number;
  hoursUntilStart: number;
  kind: 'cancel' | 'no_show';
}): number {
  if (params.kind === 'no_show') return 0;
  if (params.hoursUntilStart >= CANCEL_FULL_REFUND_HOURS) return params.paidCents;
  return Math.round(params.paidCents * LATE_CANCEL_REFUND_RATE);
}
