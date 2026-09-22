import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVenueDto } from './dto/create-venue.dto';
import { CreateCourtDto } from './dto/create-court.dto';
import { SetAvailabilityDto } from './dto/availability.dto';
import { CreateBlockDto } from './dto/create-block.dto';

function slugify(input: string) {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 60);
}

@Injectable()
export class PartnerService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertOwnsVenue(userId: string, venueId: string) {
    const venue = await this.prisma.venue.findUnique({ where: { id: venueId } });
    if (!venue) throw new NotFoundException('Local não encontrado');
    if (venue.ownerId !== userId) {
      throw new ForbiddenException('Você não gerencia este local');
    }
    return venue;
  }

  private async assertOwnsCourt(userId: string, courtId: string) {
    const court = await this.prisma.court.findUnique({
      where: { id: courtId },
      include: { venue: true },
    });
    if (!court) throw new NotFoundException('Quadra não encontrada');
    if (court.venue.ownerId !== userId) {
      throw new ForbiddenException('Você não gerencia esta quadra');
    }
    return court;
  }

  listMyVenues(userId: string) {
    return this.prisma.venue.findMany({
      where: { ownerId: userId },
      include: {
        courts: { include: { sport: true, availabilities: true, blocks: true } },
        monthlyInvoices: { orderBy: { yearMonth: 'desc' }, take: 6 },
      },
      orderBy: { name: 'asc' },
    });
  }

  async createVenue(userId: string, dto: CreateVenueDto) {
    const base = slugify(dto.name) || 'local';
    let slug = base;
    let i = 1;
    while (await this.prisma.venue.findUnique({ where: { slug } })) {
      slug = `${base}-${i++}`;
    }
    return this.prisma.venue.create({
      data: {
        slug,
        name: dto.name,
        description: dto.description,
        address: dto.address,
        neighborhood: dto.neighborhood,
        city: dto.city ?? 'Porto Alegre',
        state: dto.state ?? 'RS',
        lat: dto.lat,
        lng: dto.lng,
        photoUrls: dto.photoUrls ?? [],
        ownerId: userId,
      },
    });
  }

  async updateVenue(userId: string, venueId: string, dto: Partial<CreateVenueDto>) {
    await this.assertOwnsVenue(userId, venueId);
    return this.prisma.venue.update({
      where: { id: venueId },
      data: {
        name: dto.name,
        description: dto.description,
        address: dto.address,
        neighborhood: dto.neighborhood,
        city: dto.city,
        state: dto.state,
        lat: dto.lat,
        lng: dto.lng,
        photoUrls: dto.photoUrls,
      },
    });
  }

  async createCourt(userId: string, venueId: string, dto: CreateCourtDto) {
    await this.assertOwnsVenue(userId, venueId);
    const sport = await this.prisma.sport.findUnique({ where: { id: dto.sportId } });
    if (!sport) throw new NotFoundException('Esporte não encontrado');
    return this.prisma.court.create({
      data: {
        venueId,
        sportId: dto.sportId,
        name: dto.name,
        priceCents: dto.priceCents,
        active: dto.active ?? true,
      },
      include: { sport: true },
    });
  }

  async updateCourt(
    userId: string,
    courtId: string,
    dto: Partial<CreateCourtDto>,
  ) {
    await this.assertOwnsCourt(userId, courtId);
    return this.prisma.court.update({
      where: { id: courtId },
      data: {
        name: dto.name,
        priceCents: dto.priceCents,
        active: dto.active,
        sportId: dto.sportId,
      },
      include: { sport: true },
    });
  }

  async setAvailability(userId: string, courtId: string, dto: SetAvailabilityDto) {
    await this.assertOwnsCourt(userId, courtId);
    await this.prisma.$transaction([
      this.prisma.courtAvailability.deleteMany({ where: { courtId } }),
      this.prisma.courtAvailability.createMany({
        data: dto.slots.map((s) => ({
          courtId,
          weekday: s.weekday,
          startMinute: s.startMinute,
          endMinute: s.endMinute,
          priceCents: s.priceCents,
        })),
      }),
    ]);
    return this.prisma.courtAvailability.findMany({
      where: { courtId },
      orderBy: [{ weekday: 'asc' }, { startMinute: 'asc' }],
    });
  }

  async createBlock(userId: string, courtId: string, dto: CreateBlockDto) {
    await this.assertOwnsCourt(userId, courtId);
    return this.prisma.courtBlock.create({
      data: {
        courtId,
        startsAt: new Date(dto.startsAt),
        endsAt: new Date(dto.endsAt),
        reason: dto.reason,
      },
    });
  }

  async deleteBlock(userId: string, blockId: string) {
    const block = await this.prisma.courtBlock.findUnique({
      where: { id: blockId },
      include: { court: { include: { venue: true } } },
    });
    if (!block) throw new NotFoundException('Bloqueio não encontrado');
    if (block.court.venue.ownerId !== userId) {
      throw new ForbiddenException('Você não gerencia este bloqueio');
    }
    await this.prisma.courtBlock.delete({ where: { id: blockId } });
    return { ok: true };
  }

  async dashboard(userId: string) {
    const venues = await this.listMyVenues(userId);
    const venueIds = venues.map((v) => v.id);
    const paid = await this.prisma.booking.findMany({
      where: {
        venueId: { in: venueIds },
        status: 'confirmed',
        payment: { status: 'paid' },
      },
      select: { priceCents: true, venueId: true, startsAt: true },
    });
    const gmvCents = paid.reduce((s, b) => s + b.priceCents, 0);
    return {
      venuesCount: venues.length,
      courtsCount: venues.reduce((s, v) => s + v.courts.length, 0),
      gmvCents,
      monthlyFeeEstimateCents: Math.round(gmvCents * 0.01),
      venues,
    };
  }
}
