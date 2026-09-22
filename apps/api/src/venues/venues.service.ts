import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VenuesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(sportSlug?: string, city?: string) {
    const venues = await this.prisma.venue.findMany({
      where: {
        active: true,
        city: city ?? 'Porto Alegre',
        ...(sportSlug
          ? { courts: { some: { sport: { slug: sportSlug }, active: true } } }
          : {}),
      },
      include: {
        courts: {
          where: { active: true },
          include: { sport: { select: { slug: true, name: true } } },
        },
      },
      orderBy: { name: 'asc' },
    });

    return venues.map((v) => {
      const prices = v.courts.map((c) => c.priceCents);
      const minPriceCents = prices.length ? Math.min(...prices) : 0;
      return {
        id: v.id,
        slug: v.slug,
        name: v.name,
        description: v.description,
        address: v.address,
        neighborhood: v.neighborhood,
        city: v.city,
        state: v.state,
        lat: v.lat,
        lng: v.lng,
        photoUrls: v.photoUrls,
        minPriceCents,
        sports: [...new Set(v.courts.map((c) => c.sport.slug))],
        courts: v.courts.map((c) => ({
          id: c.id,
          name: c.name,
          sportSlug: c.sport.slug,
          sportName: c.sport.name,
          priceCents: c.priceCents,
        })),
      };
    });
  }

  async findBySlug(slug: string) {
    const list = await this.findAll();
    const venue = list.find((v) => v.slug === slug);
    if (!venue) {
      throw new NotFoundException(`Local não encontrado: ${slug}`);
    }
    return venue;
  }
}
