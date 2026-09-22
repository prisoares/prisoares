import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AccountRole } from '@prisma/client';

export type RequestUser = {
  userId: string;
  email: string;
  roles: AccountRole[];
  activeRole: AccountRole;
};

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): RequestUser => {
    const request = ctx.switchToHttp().getRequest<{ user: RequestUser }>();
    return request.user;
  },
);
