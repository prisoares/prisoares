import { Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MapFeeService } from './map-fee.service';

@ApiTags('billing')
@Controller('billing')
export class BillingController {
  constructor(private readonly mapFees: MapFeeService) {}

  @Post('map-fees/run')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Gera faturas 1% GMV do mês anterior (job manual; também cron dia 1)',
  })
  run() {
    return this.mapFees.generateForPriorMonth();
  }

  @Post('map-fees/enforce-overdue')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Marca faturas vencidas e remove locais do mapa',
  })
  enforce() {
    return this.mapFees.enforceOverdue();
  }
}
