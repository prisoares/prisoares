import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateCourtDto {
  @IsString()
  sportId!: string;

  @IsString()
  name!: string;

  @IsInt()
  @Min(0)
  priceCents!: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
