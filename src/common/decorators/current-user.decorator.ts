import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Utilisateur } from '@prisma/client';

export const CurrentUser = createParamDecorator(
  (data: keyof Utilisateur, ctx: ExecutionContext) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const request = ctx.switchToHttp().getRequest();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { user } = request;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
    return data ? user?.[data] : user;
  },
);
