import { Module } from '@nestjs/common';
import { MapFeeService } from './map-fee.service';
import { BillingController } from './billing.controller';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [PaymentsModule],
  controllers: [BillingController],
  providers: [MapFeeService],
  exports: [MapFeeService],
})
export class BillingModule {}
