import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { AccountRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  AddPhotoDto,
  CreateBlockDto,
  CreateCourtDto,
  CreateVenueDto,
  SetAvailabilityDto,
  UpdateCourtDto,
  UpdateVenueDto,
} from './dto/partner.dto';

function slugify(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
}

@Injectable()
export class PartnerService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertPartner(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.roles.includes(AccountRole.PARTNER)) {
      throw new ForbiddenException('Conta precisa do papel Parceiro');
    }
    return user;
  }

  private async requireOwnedVenue(userId: string, venueId: string) {
    const venue = await this.prisma.venue.findUnique({
      where: { id: venueId },
      include: {
        courts: {
          include: {
            sport: true,
            weeklyAvailability: { orderBy: { dayOfWeek: 'asc' } },
            blocks: { orderBy: { startsAt: 'asc' } },
          },
        },
        mapFeeInvoices: { orderBy: [{ year: 'desc' }, { month: 'desc' }] },
      },
    });
    if (!venue) throw new NotFoundException('Local não encontrado');
    if (venue.ownerId !== userId) {
      throw new ForbiddenException('Você não é dono deste local');
    }
    return venue;
  }

  async listMine(userId: string) {
    await this.assertPartner(userId);
    const venues = await this.prisma.venue.findMany({
      where: { ownerId: userId },
      include: {
        courts: { include: { sport: true } },
        mapFeeInvoices: {
          orderBy: [{ year: 'desc' }, { month: 'desc' }],
          take: 3,
        },
      },
      orderBy: { name: 'asc' },
    });
    return venues.map((v) => this.toPartnerVenue(v));
  }

  async getOne(userId: string, venueId: string) {
    await this.assertPartner(userId);
    const venue = await this.requireOwnedVenue(userId, venueId);
    return this.toPartnerVenue(venue);
  }

  async createVenue(userId: string, dto: CreateVenueDto) {
    await this.assertPartner(userId);
    let slug = slugify(dto.name) || `local-${Date.now()}`;
    const exists = await this.prisma.venue.findUnique({ where: { slug } });
    if (exists) slug = `${slug}-${Date.now().toString(36)}`;

    const venue = await this.prisma.venue.create({
      data: {
        slug,
        name: dto.name,
        description: dto.description,
        address: dto.address,
        neighborhood: dto.neighborhood,
        city: 'Porto Alegre',
        state: 'RS',
        lat: Number(dto.lat),
        lng: Number(dto.lng),
        photoUrls: dto.photoUrls ?? [],
        ownerId: userId,
        mapVisible: true,
        active: true,
      },
      include: {
        courts: { include: { sport: true } },
        mapFeeInvoices: true,
      },
    });
    return this.toPartnerVenue(venue);
  }

  async updateVenue(userId: string, venueId: string, dto: UpdateVenueDto) {
    await this.assertPartner(userId);
    await this.requireOwnedVenue(userId, venueId);
    const venue = await this.prisma.venue.update({
      where: { id: venueId },
      data: {
        ...(dto.name != null ? { name: dto.name } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description }
          : {}),
        ...(dto.address != null ? { address: dto.address } : {}),
        ...(dto.neighborhood != null
          ? { neighborhood: dto.neighborhood }
          : {}),
        ...(dto.lat != null ? { lat: Number(dto.lat) } : {}),
        ...(dto.lng != null ? { lng: Number(dto.lng) } : {}),
        ...(dto.photoUrls != null ? { photoUrls: dto.photoUrls } : {}),
      },
      include: {
        courts: {
          include: {
            sport: true,
            weeklyAvailability: true,
            blocks: true,
          },
        },
        mapFeeInvoices: {
          orderBy: [{ year: 'desc' }, { month: 'desc' }],
        },
      },
    });
    return this.toPartnerVenue(venue);
  }

  async addPhoto(userId: string, venueId: string, dto: AddPhotoDto) {
    await this.assertPartner(userId);
    const venue = await this.requireOwnedVenue(userId, venueId);
    const photoUrls = [...venue.photoUrls, dto.url];
    const updated = await this.prisma.venue.update({
      where: { id: venueId },
      data: { photoUrls },
      include: {
        courts: { include: { sport: true } },
        mapFeeInvoices: true,
      },
    });
    return this.toPartnerVenue(updated);
  }

  async createCourt(userId: string, venueId: string, dto: CreateCourtDto) {
    await this.assertPartner(userId);
    await this.requireOwnedVenue(userId, venueId);
    const sport = await this.prisma.sport.findUnique({
      where: { slug: dto.sportSlug },
    });
    if (!sport) throw new BadRequestException('Esporte inválido');

    const court = await this.prisma.court.create({
      data: {
        venueId,
        sportId: sport.id,
        name: dto.name,
        priceCents: dto.priceCents,
      },
      include: { sport: true, weeklyAvailability: true, blocks: true },
    });

    // Default Mon–Sun 08:00–22:00
    const slots = [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
      courtId: court.id,
      dayOfWeek,
      startMin: 8 * 60,
      endMin: 22 * 60,
    }));
    await this.prisma.courtWeeklyAvailability.createMany({ data: slots });

    return this.toCourtDto(
      await this.prisma.court.findUniqueOrThrow({
        where: { id: court.id },
        include: { sport: true, weeklyAvailability: true, blocks: true },
      }),
    );
  }

  async updateCourt(userId: string, courtId: string, dto: UpdateCourtDto) {
    await this.assertPartner(userId);
    const court = await this.prisma.court.findUnique({
      where: { id: courtId },
      include: { venue: true },
    });
    if (!court) throw new NotFoundException('Quadra não encontrada');
    if (court.venue.ownerId !== userId) throw new ForbiddenException();

    const updated = await this.prisma.court.update({
      where: { id: courtId },
      data: {
        ...(dto.name != null ? { name: dto.name } : {}),
        ...(dto.priceCents != null ? { priceCents: dto.priceCents } : {}),
        ...(dto.active != null ? { active: dto.active } : {}),
      },
      include: { sport: true, weeklyAvailability: true, blocks: true },
    });
    return this.toCourtDto(updated);
  }

  async setAvailability(
    userId: string,
    courtId: string,
    dto: SetAvailabilityDto,
  ) {
    await this.assertPartner(userId);
    const court = await this.prisma.court.findUnique({
      where: { id: courtId },
      include: { venue: true },
    });
    if (!court) throw new NotFoundException('Quadra não encontrada');
    if (court.venue.ownerId !== userId) throw new ForbiddenException();

    for (const slot of dto.slots) {
      if (slot.endMin <= slot.startMin) {
        throw new BadRequestException('endMin deve ser > startMin');
      }
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.courtWeeklyAvailability.deleteMany({ where: { courtId } });
      if (dto.slots.length) {
        await tx.courtWeeklyAvailability.createMany({
          data: dto.slots.map((s) => ({
            courtId,
            dayOfWeek: s.dayOfWeek,
            startMin: s.startMin,
            endMin: s.endMin,
          })),
        });
      }
    });

    return this.toCourtDto(
      await this.prisma.court.findUniqueOrThrow({
        where: { id: courtId },
        include: { sport: true, weeklyAvailability: true, blocks: true },
      }),
    );
  }

  async createBlock(userId: string, courtId: string, dto: CreateBlockDto) {
    await this.assertPartner(userId);
    const court = await this.prisma.court.findUnique({
      where: { id: courtId },
      include: { venue: true },
    });
    if (!court) throw new NotFoundException('Quadra não encontrada');
    if (court.venue.ownerId !== userId) throw new ForbiddenException();

    const startsAt = new Date(dto.startsAt);
    const endsAt = new Date(dto.endsAt);
    if (!(endsAt > startsAt)) {
      throw new BadRequestException('endsAt deve ser após startsAt');
    }

    const block = await this.prisma.courtBlock.create({
      data: {
        courtId,
        startsAt,
        endsAt,
        reason: dto.reason,
      },
    });
    return {
      id: block.id,
      startsAt: block.startsAt.toISOString(),
      endsAt: block.endsAt.toISOString(),
      reason: block.reason,
    };
  }

  async deleteBlock(userId: string, blockId: string) {
    await this.assertPartner(userId);
    const block = await this.prisma.courtBlock.findUnique({
      where: { id: blockId },
      include: { court: { include: { venue: true } } },
    });
    if (!block) throw new NotFoundException('Bloqueio não encontrado');
    if (block.court.venue.ownerId !== userId) throw new ForbiddenException();
    await this.prisma.courtBlock.delete({ where: { id: blockId } });
    return { ok: true };
  }

  async listMapFees(userId: string, venueId: string) {
    await this.assertPartner(userId);
    await this.requireOwnedVenue(userId, venueId);
    const invoices = await this.prisma.mapFeeInvoice.findMany({
      where: { venueId },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
    return invoices.map((i) => this.toFeeDto(i));
  }

  private toPartnerVenue(v: {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    address: string;
    neighborhood: string;
    city: string;
    lat: number;
    lng: number;
    photoUrls: string[];
    active: boolean;
    mapVisible: boolean;
    courts: {
      id: string;
      name: string;
      priceCents: number;
      active: boolean;
      sport: { slug: string; name: string };
      weeklyAvailability?: {
        dayOfWeek: number;
        startMin: number;
        endMin: number;
      }[];
      blocks?: {
        id: string;
        startsAt: Date;
        endsAt: Date;
        reason: string | null;
      }[];
    }[];
    mapFeeInvoices?: {
      id: string;
      year: number;
      month: number;
      gmvCents: number;
      feeCents: number;
      status: string;
      dueAt: Date;
      paidAt: Date | null;
      pixCopyPaste: string | null;
    }[];
  }) {
    return {
      id: v.id,
      slug: v.slug,
      name: v.name,
      description: v.description,
      address: v.address,
      neighborhood: v.neighborhood,
      city: v.city,
      lat: v.lat,
      lng: v.lng,
      photoUrls: v.photoUrls,
      active: v.active,
      mapVisible: v.mapVisible,
      courts: v.courts.map((c) => this.toCourtDto(c)),
      mapFees: (v.mapFeeInvoices ?? []).map((i) => this.toFeeDto(i)),
    };
  }

  private toCourtDto(c: {
    id: string;
    name: string;
    priceCents: number;
    active?: boolean;
    sport: { slug: string; name: string };
    weeklyAvailability?: {
      dayOfWeek: number;
      startMin: number;
      endMin: number;
    }[];
    blocks?: {
      id: string;
      startsAt: Date;
      endsAt: Date;
      reason: string | null;
    }[];
  }) {
    return {
      id: c.id,
      name: c.name,
      sportSlug: c.sport.slug,
      sportName: c.sport.name,
      priceCents: c.priceCents,
      active: c.active ?? true,
      weeklyAvailability: (c.weeklyAvailability ?? []).map((w) => ({
        dayOfWeek: w.dayOfWeek,
        startMin: w.startMin,
        endMin: w.endMin,
      })),
      blocks: (c.blocks ?? []).map((b) => ({
        id: b.id,
        startsAt: b.startsAt.toISOString(),
        endsAt: b.endsAt.toISOString(),
        reason: b.reason,
      })),
    };
  }

  private toFeeDto(i: {
    id: string;
    year: number;
    month: number;
    gmvCents: number;
    feeCents: number;
    status: string;
    dueAt: Date;
    paidAt: Date | null;
    pixCopyPaste: string | null;
  }) {
    return {
      id: i.id,
      year: i.year,
      month: i.month,
      gmvCents: i.gmvCents,
      feeCents: i.feeCents,
      status: i.status,
      dueAt: i.dueAt.toISOString(),
      paidAt: i.paidAt?.toISOString() ?? null,
      pixCopyPaste: i.pixCopyPaste,
    };
  }
}
