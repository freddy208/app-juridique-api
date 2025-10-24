/* eslint-disable @typescript-eslint/no-redundant-type-constituents */
// src/common/interceptors/transform.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
  path: string;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, Response<T> | any>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T> | any> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const request = context.switchToHttp().getRequest();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const path = request.url;

    return next.handle().pipe(
      map((data) => {
        // ✅ CORRECTION: Ne pas transformer les réponses d'authentification
        // Car elles ont déjà leur propre structure avec { message, utilisateur }
        const authPaths = [
          '/api/v1/auth/login',
          '/api/v1/auth/register',
          '/api/v1/auth/profile',
          '/api/v1/auth/refresh',
        ];

        // Si c'est une route d'auth, retourner les données telles quelles
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        if (authPaths.some((authPath) => path.includes(authPath))) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return
          return data;
        }

        // Pour toutes les autres routes, appliquer la transformation
        return {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          statusCode: context.switchToHttp().getResponse().statusCode,
          message: 'Opération réussie',
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          data,
          timestamp: new Date().toISOString(),
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          path: path,
        };
      }),
    );
  }
}
