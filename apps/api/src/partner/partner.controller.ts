import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, RequestUser } from '../auth/current-user.decorator';
import { PartnerService } from './partner.service';
import {
  AddPhotoDto,
  CreateBlockDto,
  CreateCourtDto,
  CreateVenueDto,
  SetAvailabilityDto,
  UpdateCourtDto,
  UpdateVenueDto,
} from './dto/partner.dto';
import { MapFeeService } from '../billing/map-fee.service';

@ApiTags('partner')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('partner')
export class PartnerController {
  constructor(
    private readonly partner: PartnerService,
    private readonly mapFeeService: MapFeeService,
  ) {}

  @Get('venues')
  @ApiOperation({ summary: 'Meus locais (CRUD parceiro)' })
  list(@CurrentUser() user: RequestUser) {
    return this.partner.listMine(user.userId);
  }

  @Post('venues')
  @ApiOperation({ summary: 'Criar local em Porto Alegre' })
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateVenueDto) {
    return this.partner.createVenue(user.userId, dto);
  }

  @Get('venues/:id')
  @ApiOperation({ summary: 'Detalhe do local (dono)' })
  one(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.partner.getOne(user.userId, id);
  }

  @Patch('venues/:id')
  @ApiOperation({ summary: 'Editar local' })
  update(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: UpdateVenueDto,
  ) {
    return this.partner.updateVenue(user.userId, id, dto);
  }

  @Post('venues/:id/photos')
  @ApiOperation({ summary: 'Adicionar foto por URL (stub sem S3)' })
  photo(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: AddPhotoDto,
  ) {
    return this.partner.addPhoto(user.userId, id, dto);
  }

  @Post('venues/:id/courts')
  @ApiOperation({ summary: 'Criar quadra + grade semanal padrão 08–22' })
  createCourt(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: CreateCourtDto,
  ) {
    return this.partner.createCourt(user.userId, id, dto);
  }

  @Patch('courts/:id')
  @ApiOperation({ summary: 'Editar preço/nome/ativa da quadra' })
  updateCourt(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: UpdateCourtDto,
  ) {
    return this.partner.updateCourt(user.userId, id, dto);
  }

  @Put('courts/:id/availability')
  @ApiOperation({ summary: 'Definir disponibilidade semanal (substitui)' })
  availability(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: SetAvailabilityDto,
  ) {
    return this.partner.setAvailability(user.userId, id, dto);
  }

  @Post('courts/:id/blocks')
  @ApiOperation({ summary: 'Bloquear horário na quadra' })
  block(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: CreateBlockDto,
  ) {
    return this.partner.createBlock(user.userId, id, dto);
  }

  @Delete('blocks/:id')
  @ApiOperation({ summary: 'Remover bloqueio' })
  deleteBlock(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.partner.deleteBlock(user.userId, id);
  }

  @Get('venues/:id/map-fees')
  @ApiOperation({ summary: 'Faturas da taxa mensal 1% GMV' })
  listMapFees(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.partner.listMapFees(user.userId, id);
  }

  @Post('map-fees/:id/pay-stub')
  @ApiOperation({ summary: 'Marcar taxa de mapa como paga (stub)' })
  payMapFee(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.mapFeeService.markPaid(user.userId, id);
  }
}
