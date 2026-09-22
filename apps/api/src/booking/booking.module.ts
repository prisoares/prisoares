import { Module, forwardRef } from '@nestjs/common';
import { BookingService } from './booking.service';
import { BookingController } from './booking.controller';
import { BookingExpiryJob } from './booking.expiry.job';
import { InventoryModule } from '../inventory/inventory.module';
import { PaymentsModule } from '../payments/payments.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    InventoryModule,
    forwardRef(() => PaymentsModule),
    NotificationsModule,
  ],
  controllers: [BookingController],
  providers: [BookingService, BookingExpiryJob],
  exports: [BookingService],
})
export class BookingModule {}
