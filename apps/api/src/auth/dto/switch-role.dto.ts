import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AccountRole } from '@prisma/client';

export class SwitchRoleDto {
  @ApiProperty({ enum: AccountRole })
  @IsEnum(AccountRole)
  role!: AccountRole;
}
