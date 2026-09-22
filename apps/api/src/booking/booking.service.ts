import {
  Injectable,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { BookingStatus, PaymentStatus } from '@prisma/client';
import {
  HOLD_MINUTES,
  commissionCentsFromPrice,
  paymentDueAtFromStart,
} from '@ludi/shared';
import { PrismaService } from '../prisma/prisma.service';
import { SlotLockService } from '../inventory/slot-lock.service';
import { PaymentsProvider } from '../payments/payments.provider';
import { NotificationsProvider } from '../notifications/notifications.provider';
import { CreateBookingDto } from './dto/create-booking.dto';
import { computeCancelPolicy } from './booking.policies';

const ACTIVE_SLOT_STATUSES: BookingStatus[] = [
  BookingStatus.requested,
  BookingStatus.hold_15m,
  BookingStatus.accepted,
  BookingStatus.payment_pending,
  BookingStatus.confirmed,
];

@Injectable()
export class BookingService {
  private readonly logger = new Logger(BookingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly locks: SlotLockService,
    private readonly payments: PaymentsProvider,
    private readonly notifications: NotificationsProvider,
  ) {}

  async requestBooking(userId: string, dto: CreateBookingDto) {
    const startsAt = new Date(dto.startsAt);
    const endsAt = new Date(dto.endsAt);
    if (!(endsAt > startsAt)) {
      throw new BadRequestException('endsAt deve ser após startsAt');
    }
    if (startsAt.getTime() < Date.now() + 60_000) {
      throw new BadRequestException('Horário deve ser no futuro');
    }

    const court = await this.prisma.court.findUnique({
      where: { id: dto.courtId },
      include: { venue: true, sport: true },
    });
    if (!court || !court.active || !court.venue.active) {
      throw new NotFoundException('Quadra indisponível');
    }

    const holdExpiresAt = new Date(Date.now() + HOLD_MINUTES * 60_000);
    const paymentDueAt = paymentDueAtFromStart(startsAt);
    const commissionCents = commissionCentsFromPrice(court.priceCents);

    try {
      return await this.locks.withSlotLock(
        court.id,
        startsAt.toISOString(),
        HOLD_MINUTES * 60,
        async () => {
          const overlap = await this.prisma.booking.findFirst({
            where: {
              courtId: court.id,
              status: { in: ACTIVE_SLOT_STATUSES },
              startsAt: { lt: endsAt },
              endsAt: { gt: startsAt },
            },
          });
          if (overlap) {
            throw new ConflictException('Horário já reservado ou em hold');
          }

          const booking = await this.prisma.booking.create({
            data: {
              status: BookingStatus.hold_15m,
              userId,
              partnerId: court.venue.ownerId,
              venueId: court.venueId,
              courtId: court.id,
              startsAt,
              endsAt,
              holdExpiresAt,
              paymentDueAt,
              priceCents: court.priceCents,
              commissionCents,
            },
            include: this.includeRelations(),
          });

          if (court.venue.ownerId) {
            const partner = await this.prisma.user.findUnique({
              where: { id: court.venue.ownerId },
            });
            if (partner) {
              await this.notifications.sendWhatsApp({
                to: partner.phone ?? '',
                template: 'booking_request',
                variables: {
                  venue: court.venue.name,
                  court: court.name,
                  startsAt: startsAt.toISOString(),
                },
              });
              if (partner.email) {
                await this.notifications.sendEmail({
                  to: partner.email,
                  subject: 'LUDI — Nova solicitação de reserva',
                  body: `Hold 15 min: ${court.venue.name} / ${court.name} @ ${startsAt.toISOString()}`,
                  template: 'booking_request',
                });
              }
            }
          }

          return this.toDto(booking);
        },
      );
    } catch (err) {
      if (err instanceof Error && err.message === 'SLOT_LOCKED') {
        throw new ConflictException('Horário sendo processado por outro pedido');
      }
      throw err;
    }
  }

  async accept(partnerId: string, bookingId: string) {
    const booking = await this.requirePartnerBooking(partnerId, bookingId);
    this.assertHoldActive(booking);

    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: booking.userId },
    });

    const charge = await this.payments.createPixCharge({
      bookingId: booking.id,
      amountCents: booking.priceCents,
      customerCpf: user.cpf,
      customerName: user.name,
      description: `LUDI reserva ${booking.id}`,
    });

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.payment.upsert({
        where: { bookingId: booking.id },
        create: {
          bookingId: booking.id,
          status:
            charge.status === 'stub'
              ? PaymentStatus.stub
              : PaymentStatus.pending,
          amountCents: booking.priceCents,
          asaasChargeId: charge.chargeId,
          pixCopyPaste: charge.pixCopyPaste,
          pixQrCodeBase64: charge.pixQrCodeBase64,
        },
        update: {
          status:
            charge.status === 'stub'
              ? PaymentStatus.stub
              : PaymentStatus.pending,
          asaasChargeId: charge.chargeId,
          pixCopyPaste: charge.pixCopyPaste,
          pixQrCodeBase64: charge.pixQrCodeBase64,
        },
      });

      return tx.booking.update({
        where: { id: booking.id },
        data: {
          status: BookingStatus.payment_pending,
          holdExpiresAt: null,
        },
        include: this.includeRelations(),
      });
    });

    await this.notifications.notifyBooking({
      event: 'partner_accepted',
      email: user.email,
      phone: user.phone,
      variables: {
        bookingId: booking.id,
        amount: (booking.priceCents / 100).toFixed(2),
      },
    });
    await this.notifications.notifyBooking({
      event: 'payment_pending',
      email: user.email,
      phone: user.phone,
      variables: {
        bookingId: booking.id,
        amount: (booking.priceCents / 100).toFixed(2),
      },
    });

    return this.toDto(updated);
  }

  async reject(partnerId: string, bookingId: string) {
    const booking = await this.requirePartnerBooking(partnerId, bookingId);
    this.assertHoldActive(booking);

    const updated = await this.prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: BookingStatus.cancelled,
        cancelledAt: new Date(),
        cancelReason: 'partner_rejected',
        holdExpiresAt: null,
      },
      include: this.includeRelations(),
    });

    return this.toDto(updated);
  }

  async listMine(userId: string) {
    const rows = await this.prisma.booking.findMany({
      where: { userId },
      include: this.includeRelations(),
      orderBy: { startsAt: 'desc' },
    });
    return rows.map((b) => this.toDto(b));
  }

  async listPartnerInbox(partnerId: string) {
    const rows = await this.prisma.booking.findMany({
      where: {
        partnerId,
        status: {
          in: [
            BookingStatus.hold_15m,
            BookingStatus.payment_pending,
            BookingStatus.confirmed,
          ],
        },
      },
      include: this.includeRelations(),
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((b) => this.toDto(b));
  }

  async getOne(userId: string, bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: this.includeRelations(),
    });
    if (!booking) throw new NotFoundException('Reserva não encontrada');
    if (booking.userId !== userId && booking.partnerId !== userId) {
      throw new ForbiddenException();
    }
    return this.toDto(booking);
  }

  async createOrRefreshPix(userId: string, bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        venue: { select: { id: true, name: true, slug: true } },
        court: { select: { id: true, name: true, priceCents: true } },
        payment: true,
        user: {
          select: { id: true, name: true, phone: true, cpf: true },
        },
      },
    });
    if (!booking) throw new NotFoundException('Reserva não encontrada');
    if (booking.userId !== userId) throw new ForbiddenException();
    if (booking.status !== BookingStatus.payment_pending) {
      throw new BadRequestException('Reserva não está aguardando pagamento');
    }
    this.assertPaymentWindow(booking);

    const charge = await this.payments.createPixCharge({
      bookingId: booking.id,
      amountCents: booking.priceCents,
      customerCpf: booking.user.cpf,
      customerName: booking.user.name,
      description: `LUDI reserva ${booking.id}`,
    });

    const payment = await this.prisma.payment.upsert({
      where: { bookingId: booking.id },
      create: {
        bookingId: booking.id,
        status:
          charge.status === 'stub' ? PaymentStatus.stub : PaymentStatus.pending,
        amountCents: booking.priceCents,
        asaasChargeId: charge.chargeId,
        pixCopyPaste: charge.pixCopyPaste,
        pixQrCodeBase64: charge.pixQrCodeBase64,
      },
      update: {
        asaasChargeId: charge.chargeId,
        pixCopyPaste: charge.pixCopyPaste,
        pixQrCodeBase64: charge.pixQrCodeBase64,
        status:
          charge.status === 'stub' ? PaymentStatus.stub : PaymentStatus.pending,
      },
    });

    return {
      bookingId: booking.id,
      amountCents: payment.amountCents,
      commissionCents: booking.commissionCents,
      pixCopyPaste: payment.pixCopyPaste,
      pixQrCodeBase64: payment.pixQrCodeBase64,
      status: payment.status,
      paymentDueAt: booking.paymentDueAt,
    };
  }

  /** Stub helper: mark Pix paid (also used by webhook). */
  async markPaid(bookingId: string, chargeId?: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { payment: true, user: true },
    });
    if (!booking) throw new NotFoundException('Reserva não encontrada');
    if (booking.status === BookingStatus.confirmed) {
      return this.getOne(booking.userId, bookingId);
    }
    if (booking.status !== BookingStatus.payment_pending) {
      throw new BadRequestException('Reserva não aguarda pagamento');
    }
    this.assertPaymentWindow(booking);

    await this.prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { bookingId },
        data: {
          status: PaymentStatus.paid,
          paidAt: new Date(),
          ...(chargeId ? { asaasChargeId: chargeId } : {}),
        },
      });
      await tx.booking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.confirmed },
      });
    });

    await this.notifications.notifyBooking({
      event: 'confirmed',
      email: booking.user.email,
      phone: booking.user.phone,
      variables: { bookingId },
    });

    return this.getOne(booking.userId, bookingId);
  }

  async cancel(userId: string, bookingId: string, reason?: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { payment: true, user: true },
    });
    if (!booking) throw new NotFoundException('Reserva não encontrada');
    if (booking.userId !== userId) throw new ForbiddenException();
    const terminal: BookingStatus[] = [
      BookingStatus.cancelled,
      BookingStatus.expired,
      BookingStatus.no_show,
    ];
    if (terminal.includes(booking.status)) {
      throw new BadRequestException('Reserva já encerrada');
    }

    const paidCents =
      booking.payment?.status === PaymentStatus.paid
        ? booking.payment.amountCents
        : 0;
    const policy = computeCancelPolicy({
      startsAt: booking.startsAt,
      paidCents,
      kind: 'cancel',
    });

    const updated = await this.prisma.$transaction(async (tx) => {
      if (paidCents > 0 && booking.payment) {
        await tx.payment.update({
          where: { id: booking.payment.id },
          data: {
            status: PaymentStatus.refunded,
            refundCents: policy.refundCents,
            refundedAt: new Date(),
          },
        });
      }
      return tx.booking.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.cancelled,
          cancelledAt: new Date(),
          cancelReason: reason ?? policy.description,
          holdExpiresAt: null,
        },
        include: this.includeRelations(),
      });
    });

    await this.notifications.notifyBooking({
      event: 'cancelled',
      email: booking.user.email,
      phone: booking.user.phone,
      variables: {
        bookingId,
        reason: reason ?? policy.description,
      },
    });

    return { booking: this.toDto(updated), policy };
  }

  async markNoShow(partnerId: string, bookingId: string) {
    const booking = await this.requirePartnerBooking(partnerId, bookingId);
    if (booking.status !== BookingStatus.confirmed) {
      throw new BadRequestException('Só reservas confirmadas podem ser no-show');
    }
    const paidCents = booking.payment?.amountCents ?? 0;
    const policy = computeCancelPolicy({
      startsAt: booking.startsAt,
      paidCents,
      kind: 'no_show',
    });

    const updated = await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.no_show,
        cancelReason: policy.description,
      },
      include: this.includeRelations(),
    });
    return { booking: this.toDto(updated), policy };
  }

  previewCancelPolicy(startsAt: Date, paidCents: number) {
    return computeCancelPolicy({ startsAt, paidCents, kind: 'cancel' });
  }

  /** Expire holds past holdExpiresAt and unpaid past paymentDueAt. */
  async expireStale() {
    const now = new Date();
    const holdResult = await this.prisma.booking.updateMany({
      where: {
        status: BookingStatus.hold_15m,
        holdExpiresAt: { lt: now },
      },
      data: {
        status: BookingStatus.expired,
        cancelReason: 'hold_timeout_15m',
        holdExpiresAt: null,
      },
    });

    const payResult = await this.prisma.booking.updateMany({
      where: {
        status: BookingStatus.payment_pending,
        paymentDueAt: { lt: now },
      },
      data: {
        status: BookingStatus.expired,
        cancelReason: 'payment_deadline',
      },
    });

    if (holdResult.count || payResult.count) {
      this.logger.log(
        `Expired holds=${holdResult.count} payments=${payResult.count}`,
      );
    }
    return { holds: holdResult.count, payments: payResult.count };
  }

  private assertHoldActive(booking: {
    status: BookingStatus;
    holdExpiresAt: Date | null;
  }) {
    if (booking.status !== BookingStatus.hold_15m) {
      throw new BadRequestException('Reserva não está em hold');
    }
    if (booking.holdExpiresAt && booking.holdExpiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Hold de 15 min expirou');
    }
  }

  private assertPaymentWindow(booking: {
    paymentDueAt: Date | null;
    startsAt: Date;
  }) {
    const due = booking.paymentDueAt ?? paymentDueAtFromStart(booking.startsAt);
    if (due.getTime() < Date.now()) {
      throw new BadRequestException(
        'Prazo de pagamento expirou (pagar até 24h antes do horário)',
      );
    }
  }

  private async requirePartnerBooking(partnerId: string, bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: this.includeRelations(),
    });
    if (!booking) throw new NotFoundException('Reserva não encontrada');
    if (booking.partnerId !== partnerId) {
      throw new ForbiddenException('Apenas o parceiro do local pode agir');
    }
    return booking;
  }

  private includeRelations() {
    return {
      venue: { select: { id: true, name: true, slug: true } },
      court: { select: { id: true, name: true, priceCents: true } },
      payment: true,
      user: { select: { id: true, name: true, phone: true } },
    } as const;
  }

  private toDto(
    booking: {
      id: string;
      status: BookingStatus;
      startsAt: Date;
      endsAt: Date;
      holdExpiresAt: Date | null;
      paymentDueAt: Date | null;
      priceCents: number;
      commissionCents: number;
      venue: { name: string; slug: string };
      court: { name: string };
      payment: {
        status: PaymentStatus;
        pixCopyPaste: string | null;
        amountCents: number;
        pixQrCodeBase64: string | null;
      } | null;
      user?: { id: string; name: string; phone: string | null };
    },
  ) {
    return {
      id: booking.id,
      status: booking.status,
      venueName: booking.venue.name,
      venueSlug: booking.venue.slug,
      courtName: booking.court.name,
      startsAt: booking.startsAt.toISOString(),
      endsAt: booking.endsAt.toISOString(),
      holdExpiresAt: booking.holdExpiresAt?.toISOString() ?? null,
      paymentDueAt: booking.paymentDueAt?.toISOString() ?? null,
      priceCents: booking.priceCents,
      commissionCents: booking.commissionCents,
      user: booking.user
        ? { id: booking.user.id, name: booking.user.name }
        : undefined,
      payment: booking.payment
        ? {
            status: booking.payment.status,
            pixCopyPaste: booking.payment.pixCopyPaste,
            pixQrCodeBase64: booking.payment.pixQrCodeBase64,
            amountCents: booking.payment.amountCents,
          }
        : null,
    };
  }
}
