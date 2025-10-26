// clients.controller.ts

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { ChangeClientStatusDto } from './dto/change-client-status.dto';
import { FilterClientsDto } from './dto/filter-clients.dto';
import { BulkActionClientsDto } from './dto/bulk-action-clients.dto';
import { AddIdentityDocumentDto } from './dto/add-identity-document.dto';
import { AddClientNoteDto } from './dto/add-client-note.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RoleUtilisateur } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Audit } from '../common/decorators/audit.decorator';
import { Throttle } from '@nestjs/throttler';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@ApiTags('clients')
@ApiBearerAuth()
@Controller('clients')
export class ClientsController {
  constructor(
    private readonly clientsService: ClientsService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  /**
   * Créer un nouveau client
   */
  @Post()
  @Roles(
    RoleUtilisateur.ADMIN,
    RoleUtilisateur.DG,
    RoleUtilisateur.AVOCAT,
    RoleUtilisateur.SECRETAIRE,
  )
  @ApiOperation({ summary: 'Créer un nouveau client' })
  @ApiResponse({ status: 201, description: 'Client créé avec succès' })
  @ApiResponse({
    status: 409,
    description: 'Un client avec cet email ou téléphone existe déjà',
  })
  @Audit('CREATE_CLIENT')
  create(@Body() createClientDto: CreateClientDto) {
    return this.clientsService.create(createClientDto);
  }

  /**
   * Obtenir la liste des clients avec pagination et filtres
   */
  @Get()
  @Roles(
    RoleUtilisateur.ADMIN,
    RoleUtilisateur.DG,
    RoleUtilisateur.AVOCAT,
    RoleUtilisateur.SECRETAIRE,
    RoleUtilisateur.ASSISTANT,
  )
  @ApiOperation({ summary: 'Obtenir la liste des clients' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    example: 1,
    description: 'Numéro de la page',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 10,
    description: "Nombre d'éléments par page",
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    example: 'creeLe',
    description: 'Champ de tri',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['asc', 'desc'],
    example: 'desc',
    description: 'Ordre de tri',
  })
  @ApiQuery({
    name: 'statut',
    required: false,
    description: 'Filtrer par statut',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Recherche par nom, prénom, email ou téléphone',
  })
  @ApiQuery({
    name: 'vipOnly',
    required: false,
    type: Boolean,
    description: 'Filtrer uniquement les clients VIP',
  })
  @ApiQuery({
    name: 'hasActiveDossiers',
    required: false,
    type: Boolean,
    description: 'Filtrer les clients avec des dossiers actifs',
  })
  @ApiQuery({
    name: 'hasUnpaidInvoices',
    required: false,
    type: Boolean,
    description: 'Filtrer les clients avec des factures impayées',
  })
  @ApiResponse({ status: 200, description: 'Liste des clients' })
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query() filters?: FilterClientsDto,
  ) {
    return this.clientsService.findAll({
      page,
      limit,
      sortBy,
      sortOrder,
      filters,
    });
  }

  /**
   * Obtenir les statistiques globales des clients
   */
  @Get('stats')
  @Roles(RoleUtilisateur.ADMIN, RoleUtilisateur.DG, RoleUtilisateur.AVOCAT)
  @ApiOperation({ summary: 'Obtenir les statistiques globales des clients' })
  @ApiResponse({ status: 200, description: 'Statistiques des clients' })
  getStats() {
    return this.clientsService.getGlobalStats();
  }

  /**
   * Obtenir les clients inactifs
   */
  @Get('inactive')
  @Roles(RoleUtilisateur.ADMIN, RoleUtilisateur.DG)
  @ApiOperation({ summary: 'Obtenir les clients inactifs' })
  @ApiQuery({
    name: 'days',
    required: false,
    type: Number,
    example: 90,
    description: "Nombre de jours d'inactivité",
  })
  @ApiResponse({ status: 200, description: 'Liste des clients inactifs' })
  getInactiveClients(
    @Query('days', new DefaultValuePipe(90), ParseIntPipe) days: number,
  ) {
    return this.clientsService.getInactiveClients(days);
  }

  /**
   * Obtenir la liste des statuts disponibles
   */
  @Get('statuses')
  @ApiOperation({ summary: 'Obtenir la liste des statuts disponibles' })
  @ApiResponse({ status: 200, description: 'Liste des statuts disponibles' })
  getAvailableStatuses() {
    return this.clientsService.getAvailableStatuses();
  }

  /**
   * Obtenir un client par son ID
   */
  @Get(':id')
  @Roles(
    RoleUtilisateur.ADMIN,
    RoleUtilisateur.DG,
    RoleUtilisateur.AVOCAT,
    RoleUtilisateur.SECRETAIRE,
    RoleUtilisateur.ASSISTANT,
  )
  @ApiOperation({ summary: 'Obtenir un client par son ID' })
  @ApiParam({ name: 'id', description: 'ID du client', type: String })
  @ApiResponse({ status: 200, description: 'Détails du client' })
  @ApiResponse({ status: 404, description: 'Client non trouvé' })
  findOne(@Param('id') id: string) {
    return this.clientsService.findOne(id);
  }

  /**
   * Obtenir les statistiques d'un client
   */
  @Get(':id/stats')
  @Roles(
    RoleUtilisateur.ADMIN,
    RoleUtilisateur.DG,
    RoleUtilisateur.AVOCAT,
    RoleUtilisateur.JURISTE,
    RoleUtilisateur.ASSISTANT,
    RoleUtilisateur.SECRETAIRE,
    RoleUtilisateur.STAGIAIRE,
  )
  @ApiOperation({ summary: "Obtenir les statistiques d'un client" })
  @ApiParam({ name: 'id', description: 'ID du client', type: String })
  @ApiResponse({ status: 200, description: 'Statistiques du client' })
  @ApiResponse({ status: 404, description: 'Client non trouvé' })
  getClientStats(@Param('id') id: string) {
    return this.clientsService.getClientStats(id);
  }

  /**
   * Obtenir les performances d'un client
   */
  @Get(':id/performance')
  @Roles(
    RoleUtilisateur.ADMIN,
    RoleUtilisateur.DG,
    RoleUtilisateur.AVOCAT,
    RoleUtilisateur.JURISTE,
    RoleUtilisateur.ASSISTANT,
    RoleUtilisateur.SECRETAIRE,
    RoleUtilisateur.STAGIAIRE,
  )
  @ApiOperation({ summary: "Obtenir les performances d'un client" })
  @ApiParam({ name: 'id', description: 'ID du client', type: String })
  @ApiResponse({ status: 200, description: 'Performances du client' })
  @ApiResponse({ status: 404, description: 'Client non trouvé' })
  getClientPerformance(@Param('id') id: string) {
    return this.clientsService.getClientPerformance(id);
  }

  /**
   * Obtenir l'historique d'activité d'un client
   */
  @Get(':id/activity')
  @Roles(
    RoleUtilisateur.ADMIN,
    RoleUtilisateur.DG,
    RoleUtilisateur.AVOCAT,
    RoleUtilisateur.SECRETAIRE,
    RoleUtilisateur.ASSISTANT,
  )
  @ApiOperation({ summary: "Obtenir l'historique d'activité d'un client" })
  @ApiParam({ name: 'id', description: 'ID du client', type: String })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 50,
    description: "Nombre maximum d'activités à retourner",
  })
  @ApiResponse({ status: 200, description: "Historique d'activité" })
  @ApiResponse({ status: 404, description: 'Client non trouvé' })
  getActivity(
    @Param('id') id: string,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ) {
    const validLimit = Math.min(100, Math.max(1, limit));
    return this.clientsService.getClientActivity(id, validLimit);
  }

  /**
   * Obtenir le résumé financier d'un client
   */
  @Get(':id/financial-summary')
  @Roles(RoleUtilisateur.ADMIN, RoleUtilisateur.DG, RoleUtilisateur.AVOCAT)
  @ApiOperation({ summary: "Obtenir le résumé financier d'un client" })
  @ApiParam({ name: 'id', description: 'ID du client', type: String })
  @ApiResponse({ status: 200, description: 'Résumé financier' })
  @ApiResponse({ status: 404, description: 'Client non trouvé' })
  getFinancialSummary(@Param('id') id: string) {
    return this.clientsService.getFinancialSummary(id);
  }

  /**
   * Mettre à jour un client
   */
  @Patch(':id')
  @Roles(
    RoleUtilisateur.ADMIN,
    RoleUtilisateur.DG,
    RoleUtilisateur.AVOCAT,
    RoleUtilisateur.JURISTE,
    RoleUtilisateur.ASSISTANT,
    RoleUtilisateur.SECRETAIRE,
    RoleUtilisateur.STAGIAIRE,
  )
  @ApiOperation({ summary: 'Mettre à jour un client' })
  @ApiParam({ name: 'id', description: 'ID du client', type: String })
  @ApiResponse({ status: 200, description: 'Client mis à jour' })
  @ApiResponse({ status: 404, description: 'Client non trouvé' })
  @ApiResponse({
    status: 409,
    description: 'Un autre client avec cet email ou téléphone existe déjà',
  })
  @Audit('UPDATE_CLIENT')
  update(@Param('id') id: string, @Body() updateClientDto: UpdateClientDto) {
    return this.clientsService.update(id, updateClientDto);
  }

  /**
   * Changer le statut d'un client
   */
  @Patch(':id/status')
  @Roles(RoleUtilisateur.ADMIN, RoleUtilisateur.DG, RoleUtilisateur.AVOCAT)
  @ApiOperation({ summary: "Changer le statut d'un client" })
  @ApiParam({ name: 'id', description: 'ID du client', type: String })
  @ApiResponse({ status: 200, description: 'Statut du client changé' })
  @ApiResponse({ status: 404, description: 'Client non trouvé' })
  @Audit('CHANGE_CLIENT_STATUS')
  changeStatus(
    @Param('id') id: string,
    @Body() changeStatusDto: ChangeClientStatusDto,
  ) {
    return this.clientsService.changeStatus(id, changeStatusDto);
  }

  /**
   * Marquer la dernière visite d'un client
   */
  @Post(':id/mark-visit')
  @Roles(
    RoleUtilisateur.ADMIN,
    RoleUtilisateur.DG,
    RoleUtilisateur.AVOCAT,
    RoleUtilisateur.SECRETAIRE,
  )
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Marquer la dernière visite d'un client" })
  @ApiParam({ name: 'id', description: 'ID du client', type: String })
  @ApiResponse({ status: 200, description: 'Dernière visite mise à jour' })
  @ApiResponse({ status: 404, description: 'Client non trouvé' })
  markLastVisit(@Param('id') id: string) {
    return this.clientsService.markLastVisit(id);
  }

  /**
   * Ajouter un document d'identité
   */
  @Post(':id/identity-documents')
  @Roles(
    RoleUtilisateur.ADMIN,
    RoleUtilisateur.DG,
    RoleUtilisateur.AVOCAT,
    RoleUtilisateur.SECRETAIRE,
    RoleUtilisateur.JURISTE,
    RoleUtilisateur.ASSISTANT,
    RoleUtilisateur.STAGIAIRE,
  )
  @ApiOperation({ summary: "Ajouter un document d'identité pour un client" })
  @ApiParam({ name: 'id', description: 'ID du client', type: String })
  @ApiResponse({ status: 201, description: "Document d'identité ajouté" })
  @ApiResponse({ status: 404, description: 'Client non trouvé' })
  @Audit('ADD_CLIENT_IDENTITY_DOCUMENT')
  @UseInterceptors(FileInterceptor('file')) // 👈 Multer gère l'upload
  @Post(':id/documents')
  async addIdentityDocument(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File, // 👈 Le fichier uploadé
    @Body() addDocumentDto: AddIdentityDocumentDto,
  ) {
    // 1️⃣ Upload du fichier sur Cloudinary
    const uploadResult = await this.cloudinaryService.uploadFile(file);

    // 2️⃣ Appel du service en lui passant DTO + résultat Cloudinary
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.clientsService.addIdentityDocument(
      id,
      addDocumentDto,
      uploadResult,
    );
  }

  /**
   * Ajouter une note pour un client
   */
  @Post(':id/notes')
  @Roles(
    RoleUtilisateur.ADMIN,
    RoleUtilisateur.DG,
    RoleUtilisateur.AVOCAT,
    RoleUtilisateur.SECRETAIRE,
  )
  @ApiOperation({ summary: 'Ajouter une note pour un client' })
  @ApiParam({ name: 'id', description: 'ID du client', type: String })
  @ApiResponse({ status: 201, description: 'Note ajoutée' })
  @ApiResponse({ status: 404, description: 'Client non trouvé' })
  @Audit('ADD_CLIENT_NOTE')
  addNote(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() addNoteDto: AddClientNoteDto,
  ) {
    return this.clientsService.addNote(id, userId, addNoteDto);
  }

  /**
   * Actions en masse sur des clients
   */
  @Post('bulk-action')
  @Roles(RoleUtilisateur.ADMIN, RoleUtilisateur.DG)
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({
    summary: 'Effectuer une action en masse sur des clients',
  })
  @ApiResponse({ status: 200, description: 'Action en masse effectuée' })
  @Audit('BULK_CLIENT_ACTION')
  bulkAction(@Body() bulkActionDto: BulkActionClientsDto) {
    return this.clientsService.bulkAction(bulkActionDto);
  }

  /**
   * Supprimer un client (soft delete / archiver)
   */
  @Delete(':id')
  @Roles(RoleUtilisateur.ADMIN, RoleUtilisateur.DG)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Supprimer un client (archivage)' })
  @ApiParam({ name: 'id', description: 'ID du client', type: String })
  @ApiResponse({ status: 200, description: 'Client archivé' })
  @ApiResponse({ status: 404, description: 'Client non trouvé' })
  @ApiResponse({
    status: 400,
    description: 'Impossible de supprimer un client avec des dossiers actifs',
  })
  @Audit('DELETE_CLIENT')
  remove(@Param('id') id: string) {
    return this.clientsService.remove(id);
  }
}
