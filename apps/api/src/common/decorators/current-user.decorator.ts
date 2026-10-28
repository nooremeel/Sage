import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { CurrentUser } from '../casl/casl-ability.factory.js';

export const User = createParamDecorator(
  (data: keyof CurrentUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as CurrentUser | undefined;

    return data && user ? user[data] : user;
  },
);
