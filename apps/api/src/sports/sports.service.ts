import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SportsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.sport.findMany({
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        slug: true,
        name: true,
        iconKey: true,
        sortOrder: true,
      },
    });
  }
}
