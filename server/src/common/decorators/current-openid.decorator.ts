import {
  BadRequestException,
  createParamDecorator,
  ExecutionContext,
} from '@nestjs/common';
import { Request } from 'express';

export const CurrentOpenid = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const value = request.header('x-openid');

    if (!value) {
      throw new BadRequestException('缺少 openid');
    }

    return value;
  },
);
