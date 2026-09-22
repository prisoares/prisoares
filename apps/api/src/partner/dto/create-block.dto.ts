import { IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateBlockDto {
  @IsDateString()
  startsAt!: string;

  @IsDateString()
  endsAt!: string;

  @IsOptional()
  @IsString()
  reason?: string;
}
