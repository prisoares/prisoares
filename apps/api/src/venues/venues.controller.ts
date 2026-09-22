import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { VenuesService } from './venues.service';

@ApiTags('venues')
@Controller('venues')
export class VenuesController {
  constructor(private readonly venuesService: VenuesService) {}

  @Get()
  @ApiOperation({ summary: 'Lista locais em Porto Alegre' })
  @ApiQuery({ name: 'sport', required: false, description: 'slug do esporte' })
  findAll(@Query('sport') sport?: string,
    @Query('city') city?: string) {
    return this.venuesService.findAll(sport);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Detalhe de um local por slug' })
  findOne(@Param('slug') slug: string) {
    return this.venuesService.findBySlug(slug);
  }
}
