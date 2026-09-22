import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { IsString } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, RequestUser } from '../auth/current-user.decorator';
import { PushService } from './push.service';

class RegisterPushDto {
  @IsString()
  token!: string;

  @IsString()
  platform!: string;
}

@Controller('push')
@UseGuards(JwtAuthGuard)
export class PushController {
  constructor(private readonly push: PushService) {}

  @Post('register')
  register(@CurrentUser() user: RequestUser, @Body() dto: RegisterPushDto) {
    return this.push.upsertToken(user.userId, dto.token, dto.platform);
  }
}
