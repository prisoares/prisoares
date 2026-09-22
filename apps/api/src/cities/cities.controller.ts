import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('cities')
export class CitiesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list() {
    const rows = await this.prisma.venue.groupBy({
      by: ['city', 'state'],
      where: { active: true },
      _count: { _all: true },
    });
    // Multi-cidade scaffolding: seed hoje só POA; endpoint já agrega qualquer cidade
    return rows.map((r) => ({
      city: r.city,
      state: r.state,
      venuesCount: r._count._all,
    }));
  }
}
