import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: '39053344705' })
  @IsString()
  cpf!: string;

  @ApiProperty({ example: 'ludi123' })
  @IsString()
  @MinLength(6)
  password!: string;
}
