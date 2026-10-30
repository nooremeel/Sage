import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpStatus,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { createHash } from 'node:crypto';
import type { Request, Response } from 'express';

@Injectable()
export class EtagInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();

    // Only apply ETag and Cache-Control to GET requests
    if (req.method !== 'GET') {
      return next.handle();
    }

    return next.handle().pipe(
      map((data) => {
        if (!data || res.headersSent) {
          return data;
        }

        const serialized = typeof data === 'string' ? data : JSON.stringify(data);
        const hash = createHash('sha1').update(serialized).digest('hex');
        const etag = `"${hash}"`;

        res.setHeader('ETag', etag);
        res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=60');

        const ifNoneMatch = req.headers['if-none-match'];
        if (ifNoneMatch && (ifNoneMatch === etag || ifNoneMatch === hash)) {
          res.status(HttpStatus.NOT_MODIFIED);
          return null;
        }

        return data;
      }),
    );
  }
}

