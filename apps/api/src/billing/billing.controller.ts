import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AccountRole } from '@prisma/client';
import { IsString, Matches } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CurrentUser, RequestUser } from '../auth/current-user.decorator';
import { BillingService } from './billing.service';

class YearMonthDto {
  @IsString()
  @Matches(/^\d{4}-\d{2}$/)
  yearMonth!: string;
}

@Controller('partner/billing')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(AccountRole.PARTNER)
export class BillingController {
  constructor(private readonly billing: BillingService) {}

  @Get('venues/:venueId/invoices')
  list(
    @CurrentUser() user: RequestUser,
    @Param('venueId') venueId: string,
  ) {
    return this.billing.listInvoices(user.userId, venueId);
  }

  @Post('venues/:venueId/invoices')
  create(
    @CurrentUser() user: RequestUser,
    @Param('venueId') venueId: string,
    @Body() dto: YearMonthDto,
  ) {
    return this.billing.createOrRefreshInvoice(
      user.userId,
      venueId,
      dto.yearMonth,
    );
  }
}
