import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { SwitchRoleDto } from './dto/switch-role.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser, RequestUser } from './current-user.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Cadastro com CPF validado (algoritmo + bureau stub)' })
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login com CPF + senha → JWT' })
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Usuário autenticado' })
  me(@CurrentUser() user: RequestUser) {
    return this.auth.me(user.userId);
  }

  @Post('switch-role')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Troca papel ativo USER ↔ PARTNER (conta dual)' })
  switchRole(@CurrentUser() user: RequestUser, @Body() dto: SwitchRoleDto) {
    return this.auth.switchRole(user.userId, dto.role);
  }
}
