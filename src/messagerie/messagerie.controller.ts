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
} from '@nestjs/swagger';
import { MessagerieService } from './messagerie.service';
import { CreateDiscussionDto } from './dto/create-discussion.dto';
import { UpdateDiscussionDto } from './dto/update-discussion.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { CreateReactionDto } from './dto/create-reaction.dto';
import { QueryDiscussionsDto } from './dto/query-discussions.dto';
import { QueryMessagesDto } from './dto/query-messages.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { RequirePermissions } from '../permissions/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ParseUUIDPipe } from '../common/pipes/parse-uuid.pipe';

@ApiTags('Messagerie')
@Controller('messagerie')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class MessagerieController {
  constructor(private readonly messagerieService: MessagerieService) {}

  // -------------------- GESTION DES DISCUSSIONS --------------------
  @Post('discussions')
  @RequirePermissions('MESSAGERIE.ecriture')
  @ApiOperation({ summary: 'Créer une nouvelle discussion' })
  @ApiResponse({ status: 201, description: 'Discussion créée avec succès' })
  createDiscussion(
    @Body() createDiscussionDto: CreateDiscussionDto,
    @CurrentUser('id') createurId: string,
  ) {
    return this.messagerieService.createDiscussion(
      createDiscussionDto,
      createurId,
    );
  }

  @Get('discussions')
  @RequirePermissions('MESSAGERIE.lecture')
  @ApiOperation({ summary: 'Récupérer la liste des discussions' })
  @ApiResponse({
    status: 200,
    description: 'Liste des discussions récupérée avec succès',
  })
  findAllDiscussions(
    @Query() query: QueryDiscussionsDto,
    @CurrentUser('id') utilisateurId: string,
  ) {
    return this.messagerieService.findAllDiscussions(query, utilisateurId);
  }

  @Get('discussions/:id')
  @RequirePermissions('MESSAGERIE.lecture')
  @ApiOperation({ summary: "Récupérer les détails d'une discussion" })
  @ApiParam({ name: 'id', description: 'ID de la discussion' })
  @ApiResponse({
    status: 200,
    description: 'Détails de la discussion récupérés avec succès',
  })
  @ApiResponse({
    status: 404,
    description: 'Discussion non trouvée',
  })
  findOneDiscussion(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') utilisateurId: string,
  ) {
    return this.messagerieService.findOneDiscussion(id, utilisateurId);
  }

  @Patch('discussions/:id')
  @RequirePermissions('MESSAGERIE.ecriture')
  @ApiOperation({ summary: 'Mettre à jour une discussion' })
  @ApiParam({ name: 'id', description: 'ID de la discussion' })
  @ApiResponse({
    status: 200,
    description: 'Discussion mise à jour avec succès',
  })
  @ApiResponse({
    status: 404,
    description: 'Discussion non trouvée',
  })
  updateDiscussion(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDiscussionDto: UpdateDiscussionDto,
    @CurrentUser('id') utilisateurId: string,
  ) {
    return this.messagerieService.updateDiscussion(
      id,
      updateDiscussionDto,
      utilisateurId,
    );
  }

  @Delete('discussions/:id')
  @RequirePermissions('MESSAGERIE.suppression')
  @ApiOperation({ summary: 'Supprimer une discussion' })
  @ApiParam({ name: 'id', description: 'ID de la discussion' })
  @ApiResponse({
    status: 200,
    description: 'Discussion supprimée avec succès',
  })
  @ApiResponse({
    status: 404,
    description: 'Discussion non trouvée',
  })
  removeDiscussion(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') utilisateurId: string,
  ) {
    return this.messagerieService.removeDiscussion(id, utilisateurId);
  }

  // -------------------- GESTION DES MESSAGES --------------------
  @Post('messages')
  @RequirePermissions('MESSAGERIE.ecriture')
  @ApiOperation({ summary: 'Créer un nouveau message' })
  @ApiResponse({ status: 201, description: 'Message créé avec succès' })
  createMessage(
    @Body() createMessageDto: CreateMessageDto,
    @CurrentUser('id') expediteurId: string,
  ) {
    return this.messagerieService.createMessage(createMessageDto, expediteurId);
  }

  @Get('messages')
  @RequirePermissions('MESSAGERIE.lecture')
  @ApiOperation({ summary: 'Récupérer la liste des messages' })
  @ApiResponse({
    status: 200,
    description: 'Liste des messages récupérée avec succès',
  })
  findAllMessages(
    @Query() query: QueryMessagesDto,
    @CurrentUser('id') utilisateurId: string,
  ) {
    return this.messagerieService.findAllMessages(query, utilisateurId);
  }

  @Get('messages/:id')
  @RequirePermissions('MESSAGERIE.lecture')
  @ApiOperation({ summary: "Récupérer les détails d'un message" })
  @ApiParam({ name: 'id', description: 'ID du message' })
  @ApiResponse({
    status: 200,
    description: 'Détails du message récupérés avec succès',
  })
  @ApiResponse({
    status: 404,
    description: 'Message non trouvé',
  })
  findOneMessage(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') utilisateurId: string,
  ) {
    return this.messagerieService.findOneMessage(id, utilisateurId);
  }

  @Patch('messages/:id')
  @RequirePermissions('MESSAGERIE.ecriture')
  @ApiOperation({ summary: 'Mettre à jour un message' })
  @ApiParam({ name: 'id', description: 'ID du message' })
  @ApiResponse({
    status: 200,
    description: 'Message mis à jour avec succès',
  })
  @ApiResponse({
    status: 404,
    description: 'Message non trouvé',
  })
  updateMessage(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateMessageDto: UpdateMessageDto,
    @CurrentUser('id') utilisateurId: string,
  ) {
    return this.messagerieService.updateMessage(
      id,
      updateMessageDto,
      utilisateurId,
    );
  }

  @Delete('messages/:id')
  @RequirePermissions('MESSAGERIE.suppression')
  @ApiOperation({ summary: 'Supprimer un message' })
  @ApiParam({ name: 'id', description: 'ID du message' })
  @ApiResponse({
    status: 200,
    description: 'Message supprimé avec succès',
  })
  @ApiResponse({
    status: 404,
    description: 'Message non trouvé',
  })
  removeMessage(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') utilisateurId: string,
  ) {
    return this.messagerieService.removeMessage(id, utilisateurId);
  }

  // -------------------- GESTION DES RÉACTIONS --------------------
  @Post('messages/:id/reactions')
  @RequirePermissions('MESSAGERIE.ecriture')
  @ApiOperation({ summary: 'Ajouter une réaction à un message' })
  @ApiParam({ name: 'id', description: 'ID du message' })
  @ApiResponse({
    status: 200,
    description: 'Réaction ajoutée avec succès',
  })
  addReaction(
    @Param('id', ParseUUIDPipe) messageId: string,
    @Body() createReactionDto: CreateReactionDto,
    @CurrentUser('id') utilisateurId: string,
  ) {
    return this.messagerieService.addReaction(
      messageId,
      createReactionDto,
      utilisateurId,
    );
  }

  @Delete('messages/:id/reactions')
  @RequirePermissions('MESSAGERIE.ecriture')
  @ApiOperation({ summary: "Retirer une réaction d'un message" })
  @ApiParam({ name: 'id', description: 'ID du message' })
  @ApiResponse({
    status: 200,
    description: 'Réaction retirée avec succès',
  })
  removeReaction(
    @Param('id', ParseUUIDPipe) messageId: string,
    @CurrentUser('id') utilisateurId: string,
  ) {
    return this.messagerieService.removeReaction(messageId, utilisateurId);
  }

  // -------------------- STATISTIQUES --------------------
  @Get('stats')
  @RequirePermissions('MESSAGERIE.lecture')
  @ApiOperation({ summary: 'Récupérer les statistiques de la messagerie' })
  @ApiResponse({
    status: 200,
    description: 'Statistiques récupérées avec succès',
  })
  getStats(@CurrentUser('id') utilisateurId?: string) {
    return this.messagerieService.getStats(utilisateurId);
  }

  // -------------------- ENDPOINTS SPÉCIFIQUES --------------------
  @Get('discussions/dossier/:dossierId')
  @RequirePermissions('MESSAGERIE.lecture')
  @ApiOperation({ summary: "Récupérer les discussions d'un dossier" })
  @ApiParam({ name: 'dossierId', description: 'ID du dossier' })
  @ApiResponse({
    status: 200,
    description: 'Discussions du dossier récupérées avec succès',
  })
  getDiscussionsByDossier(
    @Param('dossierId', ParseUUIDPipe) dossierId: string,
    @Query() query: QueryDiscussionsDto,
    @CurrentUser('id') utilisateurId: string,
  ) {
    return this.messagerieService.findAllDiscussions(
      { ...query, dossierId },
      utilisateurId,
    );
  }

  @Get('discussions/discussion/:discussionId/messages')
  @RequirePermissions('MESSAGERIE.lecture')
  @ApiOperation({ summary: "Récupérer les messages d'une discussion" })
  @ApiParam({ name: 'discussionId', description: 'ID de la discussion' })
  @ApiResponse({
    status: 200,
    description: 'Messages de la discussion récupérés avec succès',
  })
  getMessagesByDiscussion(
    @Param('discussionId', ParseUUIDPipe) discussionId: string,
    @Query() query: QueryMessagesDto,
    @CurrentUser('id') utilisateurId: string,
  ) {
    return this.messagerieService.findAllMessages(
      { ...query, discussionId },
      utilisateurId,
    );
  }
}
