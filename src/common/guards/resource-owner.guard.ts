import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class ResourceOwnerGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const request = context.switchToHttp().getRequest();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { user } = request;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const resourceId = request.params.id;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
    const resourceType = this.getResourceTypeFromRoute(request.route.path);

    if (!resourceId || !resourceType) {
      return true;
    }

    // Les administrateurs et DG peuvent accéder à toutes les ressources
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (user.role === 'ADMIN' || user.role === 'DG') {
      return true;
    }

    let resource;
    switch (resourceType) {
      case 'dossier':
        resource = await this.prisma.dossier.findUnique({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          where: { id: resourceId },
        });
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
        return resource && resource.responsableId === user.id;
      case 'tache':
        resource = await this.prisma.tache.findUnique({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          where: { id: resourceId },
        });
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return (
          resource &&
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          (resource.assigneeId === user.id || resource.creeParId === user.id)
        );
      case 'document':
        resource = await this.prisma.document.findUnique({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          where: { id: resourceId },
        });
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
        return resource && resource.televersePar === user.id;
      default:
        return true;
    }
  }

  private getResourceTypeFromRoute(path: string): string | null {
    if (path.includes('/dossiers')) return 'dossier';
    if (path.includes('/taches')) return 'tache';
    if (path.includes('/documents')) return 'document';
    return null;
  }
}
