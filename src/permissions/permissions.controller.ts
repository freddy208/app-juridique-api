/* eslint-disable prettier/prettier */
// src/permissions/permissions.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PermissionsService } from './permissions.service';
import { RoleUtilisateur } from '@prisma/client';
import { PermissionsByRoleDto } from './dto/create-permissions.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { PermissionsGuard } from './guards/permissions.guard';
import { RequirePermissions } from './decorators/permissions.decorator';

@ApiTags('Permissions')
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get('roles')
  @ApiOperation({ summary: 'Liste tous les rôles disponibles' })
  getRoles() {
    return this.permissionsService.getAllRoles();
  }

  @Get('roles/:role')
  @ApiOperation({ summary: 'Récupère les permissions d’un rôle' })
  getPermissions(@Param('role') role: RoleUtilisateur) {
    return this.permissionsService.getPermissionsByRole(role);
  }

  @Post('roles/:role')
  @ApiOperation({ summary: 'Ajoute ou met à jour les permissions d’un rôle' })
  upsert(@Param('role') role: RoleUtilisateur, @Body() dto: PermissionsByRoleDto) {
    return this.permissionsService.upsertPermissions(role, dto);
  }

  @Patch('roles/:role/:module')
  @ApiOperation({ summary: 'Met à jour une permission spécifique' })
  update(
    @Param('role') role: RoleUtilisateur,
    @Param('module') module: string,
    @Body() dto: UpdatePermissionDto,
  ) {
    return this.permissionsService.updatePermission(role, module, dto);
  }

  @Delete('roles/:role/:module')
  @ApiOperation({ summary: 'Désactive une permission (soft delete)' })
  remove(@Param('role') role: RoleUtilisateur, @Param('module') module: string) {
    return this.permissionsService.deletePermission(role, module);
  }

  // Exemple d’usage du guard :
  @Get('secure/example')
  @RequirePermissions('USERS.lecture')
  @UseGuards(PermissionsGuard)
  secureExample() {
    return { message: 'Accès autorisé à la route protégée.' };
  }
}
