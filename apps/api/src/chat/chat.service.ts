import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertParticipant(userId: string, bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });
    if (!booking) throw new NotFoundException('Reserva não encontrada');
    if (booking.userId !== userId && booking.partnerId !== userId) {
      throw new ForbiddenException('Sem acesso a este chat');
    }
    return booking;
  }

  async list(userId: string, bookingId: string) {
    await this.assertParticipant(userId, bookingId);
    return this.prisma.chatMessage.findMany({
      where: { bookingId },
      orderBy: { createdAt: 'asc' },
      include: { sender: { select: { id: true, name: true } } },
    });
  }

  async send(userId: string, bookingId: string, body: string) {
    await this.assertParticipant(userId, bookingId);
    return this.prisma.chatMessage.create({
      data: { bookingId, senderId: userId, body },
      include: { sender: { select: { id: true, name: true } } },
    });
  }
}
