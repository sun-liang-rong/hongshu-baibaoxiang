import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { ERROR_CODES } from '../constants/error-codes';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  { code: number; message: string; data: T }
> {
  intercept(
    _context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<{ code: number; message: string; data: T }> {
    return next.handle().pipe(
      map((data) => ({
        code: ERROR_CODES.SUCCESS,
        message: 'success',
        data,
      })),
    );
  }
}
