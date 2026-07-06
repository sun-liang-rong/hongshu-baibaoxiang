import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

type RequestWithUser = Request & {
  user?: unknown;
};

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): unknown => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    return request.user;
  },
);
