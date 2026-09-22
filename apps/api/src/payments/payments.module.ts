import { Module, forwardRef } from '@nestjs/common';
import { AsaasPaymentsProvider, PaymentsProvider } from './payments.provider';
import { PaymentsController } from './payments.controller';
import { BookingModule } from '../booking/booking.module';

@Module({
  imports: [forwardRef(() => BookingModule)],
  controllers: [PaymentsController],
  providers: [{ provide: PaymentsProvider, useClass: AsaasPaymentsProvider }],
  exports: [PaymentsProvider],
})
export class PaymentsModule {}
