import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentsProvider } from '../payments/payments.provider';

const FEE_RATE = 0.01;

@Injectable()
export class BillingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly payments: PaymentsProvider,
  ) {}

  /** yearMonth = YYYY-MM */
  async computeGmv(venueId: string, yearMonth: string) {
    const [y, m] = yearMonth.split('-').map(Number);
    const start = new Date(Date.UTC(y, m - 1, 1));
    const end = new Date(Date.UTC(y, m, 1));
    const paid = await this.prisma.booking.findMany({
      where: {
        venueId,
        status: 'confirmed',
        payment: { status: 'paid', paidAt: { gte: start, lt: end } },
      },
      select: { priceCents: true },
    });
    const gmvCents = paid.reduce((s, b) => s + b.priceCents, 0);
    const feeCents = Math.round(gmvCents * FEE_RATE);
    return { gmvCents, feeCents, yearMonth };
  }

  async createOrRefreshInvoice(
    ownerId: string,
    venueId: string,
    yearMonth: string,
  ) {
    const venue = await this.prisma.venue.findUnique({
      where: { id: venueId },
      include: { owner: true },
    });
    if (!venue) throw new NotFoundException('Local não encontrado');
    if (venue.ownerId !== ownerId) {
      throw new ForbiddenException('Você não gerencia este local');
    }
    const { gmvCents, feeCents } = await this.computeGmv(venueId, yearMonth);
    const externalRef = `venue-fee:${venueId}:${yearMonth}`;
    const charge = await this.payments.createPixCharge({
      bookingId: externalRef,
      amountCents: Math.max(feeCents, 1),
      customerCpf: venue.owner?.cpf ?? '00000000000',
      customerName: venue.owner?.name ?? venue.name,
      description: `LUDI taxa mapa 1% GMV ${yearMonth} — ${venue.name}`,
    });
    return this.prisma.venueMonthlyInvoice.upsert({
      where: { venueId_yearMonth: { venueId, yearMonth } },
      create: {
        venueId,
        yearMonth,
        gmvCents,
        feeCents,
        status: feeCents > 0 ? 'pending' : 'paid',
        asaasChargeId: charge.chargeId,
        pixCopyPaste: charge.pixCopyPaste,
        paidAt: feeCents > 0 ? null : new Date(),
      },
      update: {
        gmvCents,
        feeCents,
        status: feeCents > 0 ? 'pending' : 'paid',
        asaasChargeId: charge.chargeId,
        pixCopyPaste: charge.pixCopyPaste,
      },
    });
  }

  async listInvoices(ownerId: string, venueId: string) {
    const venue = await this.prisma.venue.findUnique({ where: { id: venueId } });
    if (!venue) throw new NotFoundException('Local não encontrado');
    if (venue.ownerId !== ownerId) {
      throw new ForbiddenException('Você não gerencia este local');
    }
    return this.prisma.venueMonthlyInvoice.findMany({
      where: { venueId },
      orderBy: { yearMonth: 'desc' },
    });
  }
}
