import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AccountRole } from '@prisma/client';
import { ROLES_KEY } from './roles.decorator';
import { RequestUser } from './current-user.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<AccountRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!roles?.length) return true;
    const req = context.switchToHttp().getRequest<{ user: RequestUser }>();
    const user = req.user;
    if (!user) throw new ForbiddenException('Não autenticado');
    const ok =
      roles.includes(user.activeRole) ||
      roles.some((r) => user.roles.includes(r));
    if (!ok) throw new ForbiddenException('Acesso restrito a parceiros');
    return true;
  }
}
