import { IsDateString, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBookingDto {
  @ApiProperty()
  @IsString()
  courtId!: string;

  @ApiProperty({ example: '2026-09-25T19:00:00.000Z' })
  @IsDateString()
  startsAt!: string;

  @ApiProperty({ example: '2026-09-25T20:00:00.000Z' })
  @IsDateString()
  endsAt!: string;
}
