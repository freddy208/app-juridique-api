import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangeStatusDto } from './dto/change-status.dto';
import { FilterUsersDto } from './dto/filter-users.dto';
import { BulkActionDto } from './dto/bulk-action.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Audit } from '../common/decorators/audit.decorator';
import { Throttle } from '@nestjs/throttler';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { RoleUtilisateur } from '@prisma/client';

@ApiTags('Utilisateurs')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(RoleUtilisateur.ADMIN, RoleUtilisateur.DG)
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 créations/minute
  @ApiOperation({ summary: 'Créer un nouvel utilisateur' })
  @ApiResponse({ status: 201, description: 'Utilisateur créé avec succès' })
  @ApiResponse({
    status: 409,
    description: 'Un utilisateur avec cet email existe déjà',
  })
  @Audit('CREATE_USER')
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Roles(RoleUtilisateur.ADMIN, RoleUtilisateur.DG, RoleUtilisateur.SECRETAIRE)
  @ApiOperation({
    summary: 'Obtenir la liste des utilisateurs avec pagination et filtres',
  })
  @ApiResponse({ status: 200, description: 'Liste des utilisateurs' })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
    @Query() filters?: FilterUsersDto,
  ) {
    const paginationParams = {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
      sortBy: sortBy || 'creeLe',
      sortOrder:
        sortOrder === 'asc' || sortOrder === 'desc' ? sortOrder : 'desc',
    } as const;

    return this.usersService.findAll({ ...paginationParams, ...filters });
  }

  // ✅ CORRECTION: Toutes les routes SPÉCIFIQUES avant les routes DYNAMIQUES

  @Get('search')
  @Throttle({ default: { limit: 30, ttl: 60000 } }) // 30 recherches/minute
  @ApiOperation({ summary: 'Rechercher des utilisateurs' })
  @ApiResponse({ status: 200, description: 'Résultats de recherche' })
  search(@Query('q') query: string, @Query('limit') limit?: string) {
    const searchLimit = limit ? parseInt(limit, 10) : 10;
    return this.usersService.search(query, searchLimit);
  }

  @Get('stats')
  @Roles(RoleUtilisateur.ADMIN, RoleUtilisateur.DG)
  @ApiOperation({ summary: 'Obtenir les statistiques des utilisateurs' })
  @ApiResponse({ status: 200, description: 'Statistiques des utilisateurs' })
  getStats() {
    return this.usersService.getStats();
  }

  @Get('performance')
  @Roles(RoleUtilisateur.ADMIN, RoleUtilisateur.DG)
  @ApiOperation({ summary: 'Obtenir les performances des avocats' })
  @ApiResponse({ status: 200, description: 'Performances des avocats' })
  getPerformance() {
    return this.usersService.getPerformance();
  }

  @Get('roles')
  @ApiOperation({ summary: 'Obtenir la liste des rôles disponibles' })
  @ApiResponse({ status: 200, description: 'Liste des rôles disponibles' })
  getAvailableRoles() {
    return this.usersService.getAvailableRoles();
  }

  @Get('statuses')
  @ApiOperation({ summary: 'Obtenir la liste des statuts disponibles' })
  @ApiResponse({ status: 200, description: 'Liste des statuts disponibles' })
  getAvailableStatuses() {
    return this.usersService.getAvailableStatuses();
  }

  @Get('me')
  @ApiOperation({ summary: "Obtenir le profil de l'utilisateur connecté" })
  @ApiResponse({ status: 200, description: "Profil de l'utilisateur" })
  getCurrentUserProfile(@CurrentUser('id') userId: string) {
    return this.usersService.findOne(userId);
  }

  @Patch('me')
  @ApiOperation({
    summary: "Mettre à jour le profil de l'utilisateur connecté",
  })
  @ApiResponse({ status: 200, description: 'Profil mis à jour' })
  @Audit('UPDATE_PROFILE')
  updateCurrentUserProfile(
    @CurrentUser('id') userId: string,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(userId, updateProfileDto);
  }

  // ✅ Routes dynamiques EN DERNIER

  @Get(':id')
  @Roles(RoleUtilisateur.ADMIN, RoleUtilisateur.DG, RoleUtilisateur.SECRETAIRE)
  @ApiOperation({ summary: 'Obtenir un utilisateur par son ID' })
  @ApiResponse({ status: 200, description: "Détails de l'utilisateur" })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @Roles(RoleUtilisateur.ADMIN, RoleUtilisateur.DG)
  @ApiOperation({ summary: 'Mettre à jour un utilisateur' })
  @ApiResponse({ status: 200, description: 'Utilisateur mis à jour' })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  @Audit('UPDATE_USER')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Patch(':id/status')
  @Roles(RoleUtilisateur.ADMIN, RoleUtilisateur.DG)
  @ApiOperation({ summary: "Changer le statut d'un utilisateur" })
  @ApiResponse({ status: 200, description: "Statut de l'utilisateur changé" })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  @Audit('CHANGE_USER_STATUS')
  changeStatus(
    @Param('id') id: string,
    @Body() changeStatusDto: ChangeStatusDto,
  ) {
    return this.usersService.changeStatus(id, changeStatusDto);
  }

  @Post('bulk-action')
  @Roles(RoleUtilisateur.ADMIN, RoleUtilisateur.DG)
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 actions massives/minute
  @ApiOperation({
    summary: 'Effectuer une action en masse sur des utilisateurs',
  })
  @ApiResponse({ status: 200, description: 'Action en masse effectuée' })
  @Audit('BULK_USER_ACTION')
  bulkAction(@Body() bulkActionDto: BulkActionDto) {
    return this.usersService.bulkAction(bulkActionDto);
  }

  @Delete(':id')
  @Roles(RoleUtilisateur.ADMIN, RoleUtilisateur.DG)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Supprimer un utilisateur (soft delete)' })
  @ApiResponse({ status: 200, description: 'Utilisateur supprimé' })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  @ApiResponse({
    status: 400,
    description: 'Impossible de supprimer cet utilisateur',
  })
  @Audit('DELETE_USER')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
