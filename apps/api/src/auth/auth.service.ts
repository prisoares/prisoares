import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { createHash } from 'crypto';
import { AccountRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { isValidCpf, normalizeCpf } from '../identity/cpf';
import { CpfBureauService } from './cpf-bureau.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

export type AuthUserView = {
  id: string;
  email: string;
  name: string;
  cpf: string;
  phone: string | null;
  roles: AccountRole[];
  activeRole: AccountRole;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly cpfBureau: CpfBureauService,
  ) {}

  async register(dto: RegisterDto) {
    const cpf = normalizeCpf(dto.cpf);
    if (!isValidCpf(cpf)) {
      throw new BadRequestException('CPF inválido');
    }

    const bureau = await this.cpfBureau.validate(cpf, dto.name);
    if (!bureau.ok) {
      throw new BadRequestException(bureau.reason ?? 'CPF não validado');
    }

    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ email: dto.email.toLowerCase() }, { cpf }] },
    });
    if (existing) {
      throw new ConflictException('E-mail ou CPF já cadastrado');
    }

    const roles: AccountRole[] =
      dto.role === 'PARTNER'
        ? [AccountRole.USER, AccountRole.PARTNER]
        : [AccountRole.USER];

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        name: dto.name.trim(),
        cpf,
        phone: dto.phone?.replace(/\D/g, '') || null,
        passwordHash,
        roles,
        activeRole:
          dto.role === 'PARTNER' ? AccountRole.PARTNER : AccountRole.USER,
      },
    });

    return this.issueToken(user);
  }

  async login(dto: LoginDto) {
    const cpf = normalizeCpf(dto.cpf);
    const user = await this.prisma.user.findUnique({ where: { cpf } });
    if (!user) {
      throw new UnauthorizedException('CPF ou senha inválidos');
    }
    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) {
      // Phase 0 seed used sha256 — accept migration path
      const legacy = this.legacySha256(dto.password);
      if (user.passwordHash !== legacy) {
        throw new UnauthorizedException('CPF ou senha inválidos');
      }
      // Upgrade hash on successful legacy login
      await this.prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: await bcrypt.hash(dto.password, 10) },
      });
    }
    return this.issueToken(user);
  }

  async me(userId: string): Promise<AuthUserView> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });
    return this.toView(user);
  }

  async switchRole(userId: string, role: AccountRole) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });
    if (!user.roles.includes(role)) {
      // Dual account: enable partner on demand
      if (role === AccountRole.PARTNER) {
        const updated = await this.prisma.user.update({
          where: { id: userId },
          data: {
            roles: [...new Set([...user.roles, AccountRole.PARTNER])],
            activeRole: AccountRole.PARTNER,
          },
        });
        return this.issueToken(updated);
      }
      throw new BadRequestException('Papel não disponível nesta conta');
    }
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { activeRole: role },
    });
    return this.issueToken(updated);
  }

  private issueToken(user: {
    id: string;
    email: string;
    name: string;
    cpf: string;
    phone: string | null;
    roles: AccountRole[];
    activeRole: AccountRole;
  }) {
    const view = this.toView(user);
    const accessToken = this.jwt.sign({
      sub: user.id,
      email: user.email,
      roles: user.roles,
      activeRole: user.activeRole,
    });
    return { accessToken, user: view };
  }

  private toView(user: {
    id: string;
    email: string;
    name: string;
    cpf: string;
    phone: string | null;
    roles: AccountRole[];
    activeRole: AccountRole;
  }): AuthUserView {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      cpf: user.cpf,
      phone: user.phone,
      roles: user.roles,
      activeRole: user.activeRole,
    };
  }

  private legacySha256(plain: string): string {
    return createHash('sha256').update(`ludi:${plain}`).digest('hex');
  }
}
