import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, RequestUser } from '../auth/current-user.decorator';
import { BookingService } from './booking.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { CancelBookingDto } from './dto/cancel-booking.dto';

@ApiTags('bookings')
@Controller('bookings')
export class BookingController {
  constructor(private readonly bookings: BookingService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Solicitar reserva → hold 15 min' })
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateBookingDto) {
    return this.bookings.requestBooking(user.userId, dto);
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Minhas reservas (jogador)' })
  mine(@CurrentUser() user: RequestUser) {
    return this.bookings.listMine(user.userId);
  }

  @Get('partner/inbox')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Inbox do parceiro (aceitar/recusar)' })
  partnerInbox(@CurrentUser() user: RequestUser) {
    return this.bookings.listPartnerInbox(user.userId);
  }

  @Get('cancel-preview')
  @ApiOperation({ summary: 'Prévia da política de cancelamento (público)' })
  cancelPreview(
    @Query('startsAt') startsAt: string,
    @Query('paidCents') paidCents = '0',
  ) {
    return this.bookings.previewCancelPolicy(
      new Date(startsAt),
      Number(paidCents) || 0,
    );
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Detalhe da reserva' })
  one(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.bookings.getOne(user.userId, id);
  }

  @Post(':id/accept')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Parceiro aceita → cria Pix + payment_pending' })
  accept(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.bookings.accept(user.userId, id);
  }

  @Post(':id/reject')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Parceiro recusa → cancela e libera slot' })
  reject(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.bookings.reject(user.userId, id);
  }

  @Post(':id/pix')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Gera/atualiza cobrança Pix (QR / copia-e-cola)' })
  pix(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.bookings.createOrRefreshPix(user.userId, id);
  }

  @Post(':id/pay-stub')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Marca Pix como pago (stub local sem webhook Asaas)',
  })
  payStub(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.bookings.markPaid(id);
  }

  @Post(':id/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancelar reserva (regras ≥24h / <24h)' })
  cancel(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: CancelBookingDto,
  ) {
    return this.bookings.cancel(user.userId, id, dto.reason);
  }

  @Post(':id/no-show')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Parceiro marca no-show (sem reembolso)' })
  noShow(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.bookings.markNoShow(user.userId, id);
  }
}
