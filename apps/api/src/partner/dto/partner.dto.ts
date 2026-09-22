import { IsArray, IsInt, IsNumber, IsOptional, IsString, Min, Max, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateVenueDto {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @IsString()
  address!: string;

  @ApiProperty()
  @IsString()
  neighborhood!: string;

  @ApiProperty({ example: -30.0346 })
  @IsNumber()
  lat!: number;

  @ApiProperty({ example: -51.2177 })
  @IsNumber()
  lng!: number;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photoUrls?: string[];
}

export class UpdateVenueDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  neighborhood?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  lat?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  lng?: number;

  @ApiPropertyOptional({ type: [String], description: 'URLs (stub sem S3)' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photoUrls?: string[];
}

export class CreateCourtDto {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty({ description: 'slug do esporte' })
  @IsString()
  sportSlug!: string;

  @ApiProperty({ example: 18000 })
  @IsInt()
  @Min(0)
  priceCents!: number;
}

export class UpdateCourtDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  priceCents?: number;

  @ApiPropertyOptional()
  @IsOptional()
  active?: boolean;
}

export class WeeklySlotDto {
  @ApiProperty({ description: '0=Dom … 6=Sáb' })
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek!: number;

  @ApiProperty({ example: 480, description: 'minutos desde 00:00' })
  @IsInt()
  @Min(0)
  @Max(24 * 60)
  startMin!: number;

  @ApiProperty({ example: 1320 })
  @IsInt()
  @Min(0)
  @Max(24 * 60)
  endMin!: number;
}

export class SetAvailabilityDto {
  @ApiProperty({ type: [WeeklySlotDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WeeklySlotDto)
  slots!: WeeklySlotDto[];
}

export class CreateBlockDto {
  @ApiProperty()
  @IsString()
  startsAt!: string;

  @ApiProperty()
  @IsString()
  endsAt!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}

export class AddPhotoDto {
  @ApiProperty({ description: 'URL da foto (stub sem upload S3)' })
  @IsString()
  url!: string;
}
