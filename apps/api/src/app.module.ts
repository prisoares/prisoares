import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { SportsModule } from './sports/sports.module';
import { VenuesModule } from './venues/venues.module';
import { PaymentsModule } from './payments/payments.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AuthModule } from './auth/auth.module';
import { BookingModule } from './booking/booking.module';
import { InventoryModule } from './inventory/inventory.module';
import { PartnerModule } from './partner/partner.module';
import { BillingModule } from './billing/billing.module';
import { ChatModule } from './chat/chat.module';
import { PushModule } from './push/push.module';
import { CitiesModule } from './cities/cities.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    HealthModule,
    AuthModule,
    SportsModule,
    VenuesModule,
    InventoryModule,
    BookingModule,
    PaymentsModule,
    NotificationsModule,
    PartnerModule,
    BillingModule,
    ChatModule,
    PushModule,
    CitiesModule,
  ],
})
export class AppModule {}
