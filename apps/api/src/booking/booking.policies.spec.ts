import { computeCancelPolicy } from './booking.policies';

describe('computeCancelPolicy', () => {
  const startsAt = new Date('2026-09-25T19:00:00.000Z');

  it('full refund when ≥24h before start', () => {
    const now = new Date('2026-09-24T18:00:00.000Z'); // 25h before
    const policy = computeCancelPolicy({
      startsAt,
      now,
      paidCents: 10000,
      kind: 'cancel',
    });
    expect(policy.refundCents).toBe(10000);
    expect(policy.penaltyCents).toBe(0);
  });

  it('55% refund when <24h before start', () => {
    const now = new Date('2026-09-25T10:00:00.000Z'); // 9h before
    const policy = computeCancelPolicy({
      startsAt,
      now,
      paidCents: 10000,
      kind: 'cancel',
    });
    expect(policy.refundCents).toBe(5500);
    expect(policy.penaltyCents).toBe(4500);
  });

  it('no refund on no-show', () => {
    const policy = computeCancelPolicy({
      startsAt,
      now: startsAt,
      paidCents: 10000,
      kind: 'no_show',
    });
    expect(policy.refundCents).toBe(0);
    expect(policy.penaltyCents).toBe(10000);
  });
});
