import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';

const BOOL_FIELDS = ['isActive', 'bajoPedido', 'isFeatured', 'isPublished', 'inStock', 'isOnSale'];

function coerce(value: unknown): unknown {
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (value === '1' || value === 1) return true;
  if (value === '0' || value === 0) return false;
  return value;
}

@Injectable()
export class CoerceBoolInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest();
    const body = req?.body;
    if (body && typeof body === 'object' && !Array.isArray(body)) {
      for (const key of BOOL_FIELDS) {
        if (key in body) {
          body[key] = coerce(body[key]);
        }
      }
    }
    return next.handle();
  }
}
