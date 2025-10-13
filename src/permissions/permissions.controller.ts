import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Patch,
  Delete,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiParam,
} from '@nestjs/swagger';
import { PermissionsService } from './permissions.service';
import { RoleUtilisateur } from '@prisma/client';
import { PermissionsByRoleDto } from './dto/create-permissions.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';

@ApiTags('Permissions')
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get('roles')
  @ApiOperation({ summary: 'Liste tous les rôles disponibles' })
  @ApiOkResponse({ description: 'Rôles récupérés avec succès', type: [String] })
  getRoles() {
    return this.permissionsService.getAllRoles();
  }

  @Get('roles/:role/permissions')
  @ApiOperation({ summary: 'Récupère les permissions par module pour un rôle' })
  @ApiParam({
    name: 'role',
    enum: RoleUtilisateur,
    description: 'Le rôle à consulter',
  })
  @ApiOkResponse({
    description: 'Permissions récupérées avec succès',
    type: [Object],
  })
  @ApiNotFoundResponse({
    description: 'Aucune permission trouvée pour ce rôle',
  })
  async getPermissionsByRole(@Param('role') role: RoleUtilisateur) {
    return await this.permissionsService.getPermissionsByRole(role);
  }
  @Post('roles/:role/permissions')
  @ApiOperation({ summary: 'Ajouter ou modifier les permissions pour un rôle' })
  @ApiParam({ name: 'role', enum: RoleUtilisateur })
  @ApiOkResponse({
    description: 'Permissions ajoutées/modifiées avec succès',
    type: [Object],
  })
  @ApiNotFoundResponse({
    description: 'Rôle invalide ou permissions inexistantes',
  })
  async upsertPermissions(
    @Param('role') role: RoleUtilisateur,
    @Body() dto: PermissionsByRoleDto,
  ) {
    return await this.permissionsService.upsertPermissions(role, dto);
  }
  // permissions.controller.ts

  @Patch('roles/:role/permissions/:module')
  @ApiOperation({
    summary: 'Modifier une permission spécifique pour un rôle et module',
  })
  @ApiParam({ name: 'role', enum: RoleUtilisateur })
  @ApiParam({ name: 'module', description: 'Le module à modifier' })
  @ApiOkResponse({
    description: 'Permission modifiée avec succès',
    type: Object,
  })
  @ApiNotFoundResponse({ description: 'Permission non trouvée' })
  async updatePermission(
    @Param('role') role: RoleUtilisateur,
    @Param('module') module: string,
    @Body() dto: UpdatePermissionDto,
  ) {
    return await this.permissionsService.updatePermission(role, module, dto);
  }

  // Ajout dans PermissionsController
  @Delete('roles/:role/permissions/:module')
  @ApiOperation({
    summary: 'Supprimer (soft delete) une permission pour un rôle et module',
  })
  @ApiParam({ name: 'role', enum: RoleUtilisateur })
  @ApiParam({ name: 'module', description: 'Le module à supprimer' })
  @ApiOkResponse({
    description: 'Permission supprimée avec succès',
    type: Object,
  })
  @ApiNotFoundResponse({ description: 'Permission non trouvée' })
  async deletePermission(
    @Param('role') role: RoleUtilisateur,
    @Param('module') module: string,
  ) {
    return await this.permissionsService.deletePermission(role, module);
  }
}
