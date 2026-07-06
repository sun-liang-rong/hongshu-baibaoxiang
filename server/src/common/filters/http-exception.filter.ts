import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { ERROR_CODES } from '../constants/error-codes';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    if (!(exception instanceof HttpException)) {
      this.logger.error(exception);
    }

    response.status(status).json({
      code: this.toErrorCode(status),
      message: this.toMessage(exception),
      data: null,
    });
  }

  private toMessage(exception: unknown): string {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      if (typeof response === 'string') {
        return response;
      }
      const responseBody = asRecord(response);
      if (responseBody && 'message' in responseBody) {
        const message = responseBody.message;
        return Array.isArray(message)
          ? String(message[0] ?? '')
          : String(message);
      }
      return exception.message;
    }

    return '服务器内部错误';
  }

  private toErrorCode(status: number): number {
    if (status === Number(HttpStatus.BAD_REQUEST)) {
      return ERROR_CODES.BAD_REQUEST;
    }
    if (status === Number(HttpStatus.UNAUTHORIZED)) {
      return ERROR_CODES.UNAUTHORIZED;
    }
    if (status === Number(HttpStatus.FORBIDDEN)) {
      return ERROR_CODES.FORBIDDEN;
    }
    if (status === Number(HttpStatus.NOT_FOUND)) {
      return ERROR_CODES.NOT_FOUND;
    }

    return ERROR_CODES.INTERNAL_ERROR;
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : null;
}
