import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { SportsModule } from './sports/sports.module';
import { VenuesModule } from './venues/venues.module';
import { PaymentsModule } from './payments/payments.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    HealthModule,
    SportsModule,
    VenuesModule,
    PaymentsModule,
    NotificationsModule,
  ],
})
export class AppModule {}
