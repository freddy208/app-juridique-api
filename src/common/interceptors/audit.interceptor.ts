import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../../prisma.service';
import { AUDIT_KEY } from '../decorators/audit.decorator';
import { Reflector } from '@nestjs/core';
import { Prisma } from '@prisma/client';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private prisma: PrismaService,
    private reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const request = context.switchToHttp().getRequest();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { user } = request;
    const action = this.reflector.get<string>(AUDIT_KEY, context.getHandler());
    if (!user || !action) {
      return next.handle();
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const resourceId = request.params.id;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
    const resourceType = this.getResourceTypeFromRoute(request.route.path);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const ancienneValeur = request.body;

    return next.handle().pipe(
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      tap(async (response) => {
        try {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          const nouvelleValeur = response.data || response;
          await this.prisma.journalAudit.create({
            data: {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
              utilisateurId: user.id,
              action,
              typeCible: resourceType,
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              cibleId: resourceId,
              ancienneValeur: ancienneValeur
                ? JSON.stringify(ancienneValeur)
                : Prisma.JsonNull,
              nouvelleValeur: nouvelleValeur
                ? JSON.stringify(nouvelleValeur)
                : Prisma.JsonNull,
            },
          });
        } catch (error) {
          console.error("Erreur lors de l'enregistrement de l'audit:", error);
        }
      }),
    );
  }

  private getResourceTypeFromRoute(path: string): string {
    if (path.includes('/dossiers')) return 'Dossier';
    if (path.includes('/clients')) return 'Client';
    if (path.includes('/taches')) return 'Tache';
    if (path.includes('/documents')) return 'Document';
    if (path.includes('/utilisateurs')) return 'Utilisateur';
    return 'Inconnu';
  }
}
