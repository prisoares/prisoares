import {
  Controller,
  Post,
  Body,
  Headers,
  UnauthorizedException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { BookingService } from '../booking/booking.service';
import { PrismaService } from '../prisma/prisma.service';

type AsaasWebhookPayload = {
  event?: string;
  payment?: {
    id?: string;
    status?: string;
    externalReference?: string;
  };
};

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(
    @Inject(forwardRef(() => BookingService))
    private readonly bookings: BookingService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('asaas/webhook')
  @ApiOperation({
    summary: 'Webhook Asaas — marca reserva paga quando Pix liquidado',
  })
  async asaasWebhook(
    @Headers('asaas-access-token') token: string | undefined,
    @Body() body: AsaasWebhookPayload,
  ) {
    const expected = process.env.ASAAS_WEBHOOK_TOKEN;
    if (expected && token !== expected) {
      throw new UnauthorizedException('Invalid webhook token');
    }

    const event = body.event ?? '';
    const payment = body.payment;
    this.logger.log(`Asaas webhook: ${event} charge=${payment?.id}`);

    if (!payment?.id) {
      return { ok: true, ignored: true };
    }

    const paidEvents = [
      'PAYMENT_RECEIVED',
      'PAYMENT_CONFIRMED',
      'PAYMENT_RECEIVED_IN_CASH',
    ];
    if (!paidEvents.includes(event) && payment.status !== 'RECEIVED') {
      return { ok: true, ignored: true, event };
    }

    const row = await this.prisma.payment.findFirst({
      where: {
        OR: [
          { asaasChargeId: payment.id },
          ...(payment.externalReference
            ? [{ bookingId: payment.externalReference }]
            : []),
        ],
      },
    });

    if (!row) {
      this.logger.warn(`No payment for charge ${payment.id}`);
      return { ok: true, unmatched: true };
    }

    await this.bookings.markPaid(row.bookingId, payment.id);
    return { ok: true, bookingId: row.bookingId };
  }

  /** Dev-only stub webhook without Asaas signature. */
  @Post('stub/paid')
  @ApiOperation({ summary: 'Stub: simula liquidação Pix por bookingId' })
  async stubPaid(@Body() body: { bookingId: string }) {
    if (process.env.ASAAS_API_KEY) {
      return { ok: false, message: 'Use real Asaas webhook when key is set' };
    }
    const booking = await this.bookings.markPaid(body.bookingId);
    return { ok: true, booking };
  }
}
