/* eslint-disable prettier/prettier */
// src/permissions/permissions.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import {  RoleUtilisateur } from '@prisma/client';
import { PermissionsByRoleDto } from './dto/create-permissions.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';

@Injectable()
export class PermissionsService {
  constructor(private readonly prisma: PrismaService) {}

  getAllRoles(): RoleUtilisateur[] {
    return Object.values(RoleUtilisateur);
  }

  async getPermissionsByRole(role: RoleUtilisateur) {
    const permissions = await this.prisma.permissionRole.findMany({
      where: { role, statut: 'ACTIF' },
      select: { module: true, lecture: true, ecriture: true, suppression: true },
    });

    if (!permissions.length)
      throw new NotFoundException(`Aucune permission trouvée pour ${role}`);

    return permissions;
  }

  async upsertPermissions(role: RoleUtilisateur, dto: PermissionsByRoleDto) {
    return Promise.all(
      dto.permissions.map(async (perm) => {
        const existing = await this.prisma.permissionRole.findFirst({
          where: { role, module: perm.module },
        });

        if (existing) {
          return this.prisma.permissionRole.update({
            where: { id: existing.id },
            data: { ...perm, statut: 'ACTIF' },
          });
        }

        return this.prisma.permissionRole.create({
          data: { role, ...perm, statut: 'ACTIF' },
        });
      }),
    );
  }

  async updatePermission(role: RoleUtilisateur, module: string, dto: UpdatePermissionDto) {
    const permission = await this.prisma.permissionRole.findFirst({ where: { role, module } });

    if (!permission)
      throw new NotFoundException(`Permission inexistante pour ${role} - ${module}`);

    return this.prisma.permissionRole.update({
      where: { id: permission.id },
      data: { ...dto },
    });
  }

  async deletePermission(role: RoleUtilisateur, module: string) {
    const permission = await this.prisma.permissionRole.findFirst({
      where: { role, module, statut: 'ACTIF' },
    });

    if (!permission)
      throw new NotFoundException(`Aucune permission active trouvée pour ${role}`);

    const updated = await this.prisma.permissionRole.update({
      where: { id: permission.id },
      data: { statut: 'INACTIF' },
    });

    return { message: 'Permission désactivée avec succès', permission: updated };
  }
}
