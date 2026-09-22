import { Module } from '@nestjs/common';
import { AsaasPaymentsStub, PaymentsProvider } from './payments.provider';

@Module({
  providers: [{ provide: PaymentsProvider, useClass: AsaasPaymentsStub }],
  exports: [PaymentsProvider],
})
export class PaymentsModule {}
