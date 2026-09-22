import { Module } from '@nestjs/common';
import {
  NotificationsProvider,
  WhatsApp360DialogStub,
} from './notifications.provider';

@Module({
  providers: [
    { provide: NotificationsProvider, useClass: WhatsApp360DialogStub },
  ],
  exports: [NotificationsProvider],
})
export class NotificationsModule {}
