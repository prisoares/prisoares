import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AccountRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CurrentUser, RequestUser } from '../auth/current-user.decorator';
import { PartnerService } from './partner.service';
import { CreateVenueDto } from './dto/create-venue.dto';
import { CreateCourtDto } from './dto/create-court.dto';
import { SetAvailabilityDto } from './dto/availability.dto';
import { CreateBlockDto } from './dto/create-block.dto';

@Controller('partner')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(AccountRole.PARTNER)
export class PartnerController {
  constructor(private readonly partner: PartnerService) {}

  @Get('dashboard')
  dashboard(@CurrentUser() user: RequestUser) {
    return this.partner.dashboard(user.userId);
  }

  @Get('venues')
  listVenues(@CurrentUser() user: RequestUser) {
    return this.partner.listMyVenues(user.userId);
  }

  @Post('venues')
  createVenue(@CurrentUser() user: RequestUser, @Body() dto: CreateVenueDto) {
    return this.partner.createVenue(user.userId, dto);
  }

  @Patch('venues/:venueId')
  updateVenue(
    @CurrentUser() user: RequestUser,
    @Param('venueId') venueId: string,
    @Body() dto: CreateVenueDto,
  ) {
    return this.partner.updateVenue(user.userId, venueId, dto);
  }

  @Post('venues/:venueId/courts')
  createCourt(
    @CurrentUser() user: RequestUser,
    @Param('venueId') venueId: string,
    @Body() dto: CreateCourtDto,
  ) {
    return this.partner.createCourt(user.userId, venueId, dto);
  }

  @Patch('courts/:courtId')
  updateCourt(
    @CurrentUser() user: RequestUser,
    @Param('courtId') courtId: string,
    @Body() dto: CreateCourtDto,
  ) {
    return this.partner.updateCourt(user.userId, courtId, dto);
  }

  @Post('courts/:courtId/availability')
  setAvailability(
    @CurrentUser() user: RequestUser,
    @Param('courtId') courtId: string,
    @Body() dto: SetAvailabilityDto,
  ) {
    return this.partner.setAvailability(user.userId, courtId, dto);
  }

  @Post('courts/:courtId/blocks')
  createBlock(
    @CurrentUser() user: RequestUser,
    @Param('courtId') courtId: string,
    @Body() dto: CreateBlockDto,
  ) {
    return this.partner.createBlock(user.userId, courtId, dto);
  }

  @Delete('blocks/:blockId')
  deleteBlock(
    @CurrentUser() user: RequestUser,
    @Param('blockId') blockId: string,
  ) {
    return this.partner.deleteBlock(user.userId, blockId);
  }
}
