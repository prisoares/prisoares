import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BookingService } from './booking.service';

@Injectable()
export class BookingExpiryJob {
  private readonly logger = new Logger(BookingExpiryJob.name);

  constructor(private readonly bookings: BookingService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async tick() {
    try {
      await this.bookings.expireStale();
    } catch (err) {
      this.logger.error(`expireStale failed: ${(err as Error).message}`);
    }
  }
}
