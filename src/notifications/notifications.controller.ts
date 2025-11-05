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
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { QueryNotificationsDto } from './dto/query-notifications.dto';
import { BulkNotificationDto } from './dto/bulk-notification.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { RequirePermissions } from '../permissions/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ParseUUIDPipe } from '../common/pipes/parse-uuid.pipe';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @RequirePermissions('NOTIFICATIONS.ecriture')
  @ApiOperation({ summary: 'Créer une nouvelle notification' })
  @ApiResponse({ status: 201, description: 'Notification créée avec succès' })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  create(@Body() createNotificationDto: CreateNotificationDto) {
    return this.notificationsService.create(createNotificationDto);
  }

  @Post('bulk')
  @RequirePermissions('NOTIFICATIONS.ecriture')
  @ApiOperation({ summary: 'Créer des notifications en masse' })
  @ApiResponse({ status: 201, description: 'Notifications créées avec succès' })
  @ApiResponse({
    status: 404,
    description: 'Un ou plusieurs utilisateurs non trouvés',
  })
  createBulk(@Body() bulkNotificationDto: BulkNotificationDto) {
    return this.notificationsService.createBulk(bulkNotificationDto);
  }

  @Get()
  @RequirePermissions('NOTIFICATIONS.lecture')
  @ApiOperation({ summary: 'Récupérer la liste des notifications' })
  @ApiResponse({
    status: 200,
    description: 'Liste des notifications récupérée avec succès',
  })
  findAll(@Query() query: QueryNotificationsDto) {
    return this.notificationsService.findAll(query);
  }

  @Get('stats/:utilisateurId')
  @RequirePermissions('NOTIFICATIONS.lecture')
  @ApiOperation({
    summary: "Récupérer les statistiques de notifications d'un utilisateur",
  })
  @ApiParam({ name: 'utilisateurId', description: "ID de l'utilisateur" })
  @ApiResponse({
    status: 200,
    description: 'Statistiques récupérées avec succès',
  })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  getStats(@Param('utilisateurId', ParseUUIDPipe) utilisateurId: string) {
    return this.notificationsService.getStats(utilisateurId);
  }

  @Get('unread-count/:utilisateurId')
  @RequirePermissions('NOTIFICATIONS.lecture')
  @ApiOperation({
    summary: "Récupérer le nombre de notifications non lues d'un utilisateur",
  })
  @ApiParam({ name: 'utilisateurId', description: "ID de l'utilisateur" })
  @ApiResponse({ status: 200, description: 'Nombre récupéré avec succès' })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  getUnreadCount(@Param('utilisateurId', ParseUUIDPipe) utilisateurId: string) {
    return this.notificationsService.getUnreadCount(utilisateurId);
  }

  @Get(':id')
  @RequirePermissions('NOTIFICATIONS.lecture')
  @ApiOperation({ summary: "Récupérer les détails d'une notification" })
  @ApiParam({ name: 'id', description: 'ID de la notification' })
  @ApiResponse({
    status: 200,
    description: 'Détails de la notification récupérés avec succès',
  })
  @ApiResponse({ status: 404, description: 'Notification non trouvée' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.notificationsService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions('NOTIFICATIONS.ecriture')
  @ApiOperation({ summary: 'Mettre à jour une notification' })
  @ApiParam({ name: 'id', description: 'ID de la notification' })
  @ApiResponse({
    status: 200,
    description: 'Notification mise à jour avec succès',
  })
  @ApiResponse({ status: 404, description: 'Notification non trouvée' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateNotificationDto: UpdateNotificationDto,
  ) {
    return this.notificationsService.update(id, updateNotificationDto);
  }

  @Patch(':id/mark-read')
  @RequirePermissions('NOTIFICATIONS.ecriture')
  @ApiOperation({ summary: 'Marquer une notification comme lue' })
  @ApiParam({ name: 'id', description: 'ID de la notification' })
  @ApiResponse({
    status: 200,
    description: 'Notification marquée comme lue avec succès',
  })
  @ApiResponse({ status: 404, description: 'Notification non trouvée' })
  markAsRead(@Param('id', ParseUUIDPipe) id: string) {
    return this.notificationsService.markAsRead(id);
  }

  @Patch('mark-all-read/:utilisateurId')
  @RequirePermissions('NOTIFICATIONS.ecriture')
  @ApiOperation({
    summary: "Marquer toutes les notifications d'un utilisateur comme lues",
  })
  @ApiParam({ name: 'utilisateurId', description: "ID de l'utilisateur" })
  @ApiResponse({
    status: 200,
    description: 'Notifications marquées comme lues avec succès',
  })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  markAllAsRead(@Param('utilisateurId', ParseUUIDPipe) utilisateurId: string) {
    return this.notificationsService.markAllAsRead(utilisateurId);
  }

  @Delete(':id')
  @RequirePermissions('NOTIFICATIONS.suppression')
  @ApiOperation({ summary: 'Supprimer une notification' })
  @ApiParam({ name: 'id', description: 'ID de la notification' })
  @ApiResponse({
    status: 200,
    description: 'Notification supprimée avec succès',
  })
  @ApiResponse({ status: 404, description: 'Notification non trouvée' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.notificationsService.remove(id);
  }

  @Delete('old')
  @RequirePermissions('NOTIFICATIONS.suppression')
  @ApiOperation({ summary: 'Supprimer les anciennes notifications' })
  @ApiQuery({
    name: 'daysOld',
    description:
      'Nombre de jours pour considérer une notification comme ancienne',
    required: false,
    example: 30,
  })
  @ApiResponse({
    status: 200,
    description: 'Anciennes notifications supprimées avec succès',
  })
  deleteOldNotifications(@Query('daysOld') daysOld?: number) {
    return this.notificationsService.deleteOldNotifications(daysOld);
  }

  // -------------------- ENDPOINTS POUR L'UTILISATEUR CONNECTÉ --------------------
  // -------------------- ENDPOINTS POUR L'UTILISATEUR CONNECTÉ --------------------
  @Get('profile/me')
  @ApiOperation({
    summary: "Récupérer les notifications de l'utilisateur connecté",
  })
  @ApiResponse({
    status: 200,
    description: 'Notifications récupérées avec succès',
  })
  getMyNotifications(
    @CurrentUser('id') userId: string,
    @Query() query: QueryNotificationsDto,
  ) {
    return this.notificationsService.findAll({
      ...query,
      utilisateurId: userId, // Utiliser l'ID de l'utilisateur connecté
    });
  }

  @Get('profile/me/stats')
  @ApiOperation({
    summary:
      "Récupérer les statistiques de notifications de l'utilisateur connecté",
  })
  @ApiResponse({
    status: 200,
    description: 'Statistiques récupérées avec succès',
  })
  getMyStats(@CurrentUser('id') userId: string) {
    return this.notificationsService.getStats(userId);
  }

  @Get('profile/me/unread-count')
  @ApiOperation({
    summary:
      "Récupérer le nombre de notifications non lues de l'utilisateur connecté",
  })
  @ApiResponse({ status: 200, description: 'Nombre récupéré avec succès' })
  getMyUnreadCount(@CurrentUser('id') userId: string) {
    return this.notificationsService.getUnreadCount(userId);
  }

  @Patch('profile/me/mark-all-read')
  @ApiOperation({
    summary:
      "Marquer toutes les notifications de l'utilisateur connecté comme lues",
  })
  @ApiResponse({
    status: 200,
    description: 'Notifications marquées comme lues avec succès',
  })
  markMyAllAsRead(@CurrentUser('id') userId: string) {
    return this.notificationsService.markAllAsRead(userId);
  }
}
