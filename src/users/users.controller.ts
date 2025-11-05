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
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangerPasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { RequirePermissions } from '../permissions/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ParseUUIDPipe } from '../common/pipes/parse-uuid.pipe';
import { QueryUsersDto } from './dto/filter-users.dto';

@ApiTags('Utilisateurs')
@Controller('utilisateurs')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @RequirePermissions('UTILISATEURS.ecriture')
  @ApiOperation({ summary: 'Créer un nouvel utilisateur' })
  @ApiResponse({ status: 201, description: 'Utilisateur créé avec succès' })
  @ApiResponse({
    status: 409,
    description: 'Un utilisateur avec cet email existe déjà',
  })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @RequirePermissions('UTILISATEURS.lecture')
  @ApiOperation({ summary: 'Récupérer la liste des utilisateurs' })
  @ApiResponse({
    status: 200,
    description: 'Liste des utilisateurs récupérée avec succès',
  })
  findAll(@Query() query: QueryUsersDto) {
    return this.usersService.findAll(query);
  }

  @Get('avocats/disponibles')
  @RequirePermissions('UTILISATEURS.lecture')
  @ApiOperation({ summary: 'Récupérer la liste des avocats disponibles' })
  @ApiQuery({
    name: 'dateDebut',
    required: false,
    description: 'Date de début (format ISO)',
  })
  @ApiQuery({
    name: 'dateFin',
    required: false,
    description: 'Date de fin (format ISO)',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des avocats disponibles récupérée avec succès',
  })
  getAvocatsDisponibles(
    @Query('dateDebut') dateDebut?: string,
    @Query('dateFin') dateFin?: string,
  ) {
    const debut = dateDebut ? new Date(dateDebut) : undefined;
    const fin = dateFin ? new Date(dateFin) : undefined;
    return this.usersService.getAvocatsDisponibles(debut, fin);
  }

  @Get(':id')
  @RequirePermissions('UTILISATEURS.lecture')
  @ApiOperation({ summary: "Récupérer les détails d'un utilisateur" })
  @ApiParam({ name: 'id', description: "ID de l'utilisateur" })
  @ApiResponse({
    status: 200,
    description: "Détails de l'utilisateur récupérés avec succès",
  })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findOne(id);
  }

  @Get(':id/stats')
  @RequirePermissions('UTILISATEURS.lecture')
  @ApiOperation({ summary: "Récupérer les statistiques d'un utilisateur" })
  @ApiParam({ name: 'id', description: "ID de l'utilisateur" })
  @ApiResponse({
    status: 200,
    description: "Statistiques de l'utilisateur récupérées avec succès",
  })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  getUserStats(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.getUserStats(id);
  }

  @Get(':id/dossiers')
  @RequirePermissions('UTILISATEURS.lecture')
  @ApiOperation({ summary: "Récupérer les dossiers d'un utilisateur" })
  @ApiParam({ name: 'id', description: "ID de l'utilisateur" })
  @ApiResponse({
    status: 200,
    description: "Dossiers de l'utilisateur récupérés avec succès",
  })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  getUserDossiers(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: QueryUsersDto,
  ) {
    return this.usersService.getUserDossiers(id, query);
  }

  @Get(':id/taches')
  @RequirePermissions('UTILISATEURS.lecture')
  @ApiOperation({ summary: "Récupérer les tâches d'un utilisateur" })
  @ApiParam({ name: 'id', description: "ID de l'utilisateur" })
  @ApiResponse({
    status: 200,
    description: "Tâches de l'utilisateur récupérées avec succès",
  })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  getUserTaches(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: QueryUsersDto,
  ) {
    return this.usersService.getUserTaches(id, query);
  }

  @Get(':id/evenements')
  @RequirePermissions('UTILISATEURS.lecture')
  @ApiOperation({ summary: "Récupérer les événements d'un utilisateur" })
  @ApiParam({ name: 'id', description: "ID de l'utilisateur" })
  @ApiResponse({
    status: 200,
    description: "Événements de l'utilisateur récupérés avec succès",
  })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  getUserEvenements(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: QueryUsersDto,
  ) {
    return this.usersService.getUserEvenements(id, query);
  }

  @Get(':id/notifications')
  @RequirePermissions('UTILISATEURS.lecture')
  @ApiOperation({ summary: "Récupérer les notifications d'un utilisateur" })
  @ApiParam({ name: 'id', description: "ID de l'utilisateur" })
  @ApiResponse({
    status: 200,
    description: "Notifications de l'utilisateur récupérées avec succès",
  })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  getUserNotifications(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: QueryUsersDto,
  ) {
    return this.usersService.getUserNotifications(id, query);
  }

  @Patch(':id')
  @RequirePermissions('UTILISATEURS.ecriture')
  @ApiOperation({ summary: 'Mettre à jour un utilisateur' })
  @ApiParam({ name: 'id', description: "ID de l'utilisateur" })
  @ApiResponse({
    status: 200,
    description: 'Utilisateur mis à jour avec succès',
  })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  @ApiResponse({
    status: 409,
    description: 'Un utilisateur avec cet email existe déjà',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(id, updateUserDto);
  }

  @Patch(':id/changer-mot-de-passe')
  @RequirePermissions('UTILISATEURS.ecriture')
  @ApiOperation({ summary: "Changer le mot de passe d'un utilisateur" })
  @ApiParam({ name: 'id', description: "ID de l'utilisateur" })
  @ApiResponse({ status: 200, description: 'Mot de passe changé avec succès' })
  @ApiResponse({ status: 400, description: 'Ancien mot de passe incorrect' })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  changePassword(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() changePasswordDto: ChangerPasswordDto,
  ) {
    return this.usersService.changePassword(id, changePasswordDto);
  }

  @Patch(':id/notifications/lire')
  @RequirePermissions('UTILISATEURS.ecriture')
  @ApiOperation({
    summary: "Marquer toutes les notifications d'un utilisateur comme lues",
  })
  @ApiParam({ name: 'id', description: "ID de l'utilisateur" })
  @ApiResponse({
    status: 200,
    description: 'Notifications marquées comme lues avec succès',
  })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  markNotificationsAsRead(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.markNotificationsAsRead(id);
  }

  @Delete(':id')
  @RequirePermissions('UTILISATEURS.suppression')
  @ApiOperation({ summary: 'Supprimer un utilisateur (désactivation)' })
  @ApiParam({ name: 'id', description: "ID de l'utilisateur" })
  @ApiResponse({
    status: 200,
    description: 'Utilisateur désactivé avec succès',
  })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.remove(id);
  }

  // -------------------- ENDPOINTS POUR L'UTILISATEUR CONNECTÉ --------------------
  @Get('profile/me')
  @ApiOperation({ summary: "Récupérer le profil de l'utilisateur connecté" })
  @ApiResponse({ status: 200, description: 'Profil récupéré avec succès' })
  getMyProfile(@CurrentUser('id') userId: string) {
    return this.usersService.findOne(userId);
  }

  @Get('profile/me/stats')
  @ApiOperation({
    summary: "Récupérer les statistiques de l'utilisateur connecté",
  })
  @ApiResponse({
    status: 200,
    description: 'Statistiques récupérées avec succès',
  })
  getMyStats(@CurrentUser('id') userId: string) {
    return this.usersService.getUserStats(userId);
  }

  @Get('profile/me/dossiers')
  @ApiOperation({ summary: "Récupérer les dossiers de l'utilisateur connecté" })
  @ApiResponse({ status: 200, description: 'Dossiers récupérés avec succès' })
  getMyDossiers(
    @CurrentUser('id') userId: string,
    @Query() query: QueryUsersDto,
  ) {
    return this.usersService.getUserDossiers(userId, query);
  }

  @Get('profile/me/taches')
  @ApiOperation({ summary: "Récupérer les tâches de l'utilisateur connecté" })
  @ApiResponse({ status: 200, description: 'Tâches récupérées avec succès' })
  getMyTaches(
    @CurrentUser('id') userId: string,
    @Query() query: QueryUsersDto,
  ) {
    return this.usersService.getUserTaches(userId, query);
  }

  @Get('profile/me/evenements')
  @ApiOperation({
    summary: "Récupérer les événements de l'utilisateur connecté",
  })
  @ApiResponse({ status: 200, description: 'Événements récupérés avec succès' })
  getMyEvenements(
    @CurrentUser('id') userId: string,
    @Query() query: QueryUsersDto,
  ) {
    return this.usersService.getUserEvenements(userId, query);
  }

  @Get('profile/me/notifications')
  @ApiOperation({
    summary: "Récupérer les notifications de l'utilisateur connecté",
  })
  @ApiResponse({
    status: 200,
    description: 'Notifications récupérées avec succès',
  })
  getMyNotifications(
    @CurrentUser('id') userId: string,
    @Query() query: QueryUsersDto,
  ) {
    return this.usersService.getUserNotifications(userId, query);
  }

  @Patch('profile/me/changer-mot-de-passe')
  @ApiOperation({
    summary: "Changer le mot de passe de l'utilisateur connecté",
  })
  @ApiResponse({ status: 200, description: 'Mot de passe changé avec succès' })
  @ApiResponse({ status: 400, description: 'Ancien mot de passe incorrect' })
  changeMyPassword(
    @CurrentUser('id') userId: string,
    @Body() changePasswordDto: ChangerPasswordDto,
  ) {
    return this.usersService.changePassword(userId, changePasswordDto);
  }

  @Patch('profile/me/notifications/lire')
  @ApiOperation({
    summary:
      "Marquer toutes les notifications de l'utilisateur connecté comme lues",
  })
  @ApiResponse({
    status: 200,
    description: 'Notifications marquées comme lues avec succès',
  })
  markMyNotificationsAsRead(@CurrentUser('id') userId: string) {
    return this.usersService.markNotificationsAsRead(userId);
  }
}
