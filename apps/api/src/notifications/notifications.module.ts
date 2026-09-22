import { Module } from '@nestjs/common';
import {
  NotificationsProvider,
  LudiNotificationsStub,
} from './notifications.provider';

@Module({
  providers: [
    { provide: NotificationsProvider, useClass: LudiNotificationsStub },
  ],
  exports: [NotificationsProvider],
})
export class NotificationsModule {}
