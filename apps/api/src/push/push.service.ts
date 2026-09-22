import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PushService {
  constructor(private readonly prisma: PrismaService) {}

  upsertToken(userId: string, token: string, platform: string) {
    return this.prisma.devicePushToken.upsert({
      where: { token },
      create: { userId, token, platform },
      update: { userId, platform },
    });
  }

  async notifyUser(userId: string, title: string, body: string) {
    const tokens = await this.prisma.devicePushToken.findMany({
      where: { userId },
    });
    // Expo push stub — log until EXPO_ACCESS_TOKEN configured
    // eslint-disable-next-line no-console
    console.log('[push:stub]', { userId, title, body, tokens: tokens.length });
    return { ok: true, delivered: 0, stubbed: tokens.length };
  }
}
