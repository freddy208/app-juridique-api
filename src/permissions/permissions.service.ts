import { Injectable, NotFoundException } from '@nestjs/common';
import { PermissionRole, PrismaClient, RoleUtilisateur } from '@prisma/client';
import { PermissionsByRoleDto } from './dto/create-permissions.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';

@Injectable()
export class PermissionsService {
  private prisma = new PrismaClient();

  // Récupérer tous les rôles
  getAllRoles(): RoleUtilisateur[] {
    return Object.values(RoleUtilisateur);
  }

  // Récupérer permissions par rôle
  async getPermissionsByRole(role: RoleUtilisateur) {
    const permissions = await this.prisma.permissionRole.findMany({
      where: {
        role,
        statut: 'ACTIF', // On ne prend que les permissions actives
      },
      select: {
        module: true,
        lecture: true,
        ecriture: true,
        suppression: true,
      },
    });

    if (!permissions || permissions.length === 0) {
      throw new NotFoundException(
        `Aucune permission trouvée pour le rôle ${role}`,
      );
    }

    return permissions;
  }
  // Ajouter / modifier permissions par rôle
  async upsertPermissions(role: RoleUtilisateur, dto: PermissionsByRoleDto) {
    const results: PermissionRole[] = [];

    for (const perm of dto.permissions) {
      const existing = await this.prisma.permissionRole.findFirst({
        where: { role, module: perm.module },
      });

      if (existing) {
        // Mise à jour
        const updated = await this.prisma.permissionRole.update({
          where: { id: existing.id },
          data: {
            lecture: perm.lecture,
            ecriture: perm.ecriture,
            suppression: perm.suppression,
            statut: 'ACTIF',
          },
        });
        results.push(updated);
      } else {
        // Création
        const created = await this.prisma.permissionRole.create({
          data: {
            role,
            module: perm.module,
            lecture: perm.lecture,
            ecriture: perm.ecriture,
            suppression: perm.suppression,
            statut: 'ACTIF',
          },
        });
        results.push(created);
      }
    }

    return results;
  }
  // permissions.service.ts
  async updatePermission(
    role: RoleUtilisateur,
    module: string,
    dto: UpdatePermissionDto,
  ) {
    // Vérifier si la permission existe
    const permission = await this.prisma.permissionRole.findFirst({
      where: { role, module },
    });

    if (!permission) {
      throw new NotFoundException(
        `Aucune permission trouvée pour le rôle ${role} et le module ${module}`,
      );
    }

    // Mettre à jour uniquement les champs fournis
    const updated = await this.prisma.permissionRole.update({
      where: { id: permission.id },
      data: {
        lecture: dto.lecture ?? permission.lecture,
        ecriture: dto.ecriture ?? permission.ecriture,
        suppression: dto.suppression ?? permission.suppression,
      },
    });

    return updated;
  }
  // Ajout dans PermissionsService
  async deletePermission(role: RoleUtilisateur, module: string) {
    // Vérifier si la permission existe
    const permission = await this.prisma.permissionRole.findFirst({
      where: { role, module, statut: 'ACTIF' }, // On ne supprime que si active
    });

    if (!permission) {
      throw new NotFoundException(
        `Aucune permission active trouvée pour le rôle ${role} et le module ${module}`,
      );
    }

    // Soft delete : mettre le statut à INACTIF
    const updated = await this.prisma.permissionRole.update({
      where: { id: permission.id },
      data: { statut: 'INACTIF' },
    });

    return { message: 'Permission supprimée avec succès', permission: updated };
  }
}
