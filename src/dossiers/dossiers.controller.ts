// src/dossiers/dossiers.controller.ts
import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Post,
  Body,
  Put,
  Patch,
  Delete,
  UseInterceptors,
  UploadedFiles,
  Req,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiParam,
  ApiQuery,
  ApiConsumes,
  ApiBody,
  ApiResponse,
} from '@nestjs/swagger';
import { DossiersService } from './dossiers.service';
import { FilterDossierDto } from './dto/filter-dossier.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateDossierDto } from './dto/create-dossier.dto';
import { UpdateDossierDto } from './dto/update-dossier.dto';
import { UpdateDossierStatusDto } from './dto/update-dossier-status.dto';
import { User } from '../auth/decorators/user.decorator';
import { CreateDossierNoteDto } from './dto/create-dossier-note.dto';
import { UpdateDossierNoteDto } from './dto/update-dossier-note.dto';
import { AssignDossierDto } from './dto/assign-dossier.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  BulkActionDto,
  BulkAssignDto,
  ExportDossiersDto,
} from './dto/bulk-action.dto';
import { CreateFactureDto } from './dto/create-facture.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateSpecificDetailsDto } from './dto/update-specific-details.dto';
import { SendMessageDto } from './dto/send-message.dto';

@ApiTags('dossiers')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('dossiers')
export class DossiersController {
  constructor(private readonly dossiersService: DossiersService) {}

  @Get()
  @ApiOperation({ summary: 'Liste des dossiers avec filtres' })
  @ApiResponse({
    status: 200,
    description: 'Liste des dossiers récupérée avec succès',
  })
  async findAll(@Query() filters: FilterDossierDto) {
    return this.dossiersService.findAll(filters);
  }

  @Get(':id')
  @ApiOperation({ summary: "Détails d'un dossier par ID" })
  @ApiParam({ name: 'id', description: 'ID du dossier' })
  @ApiResponse({
    status: 200,
    description: 'Détails du dossier récupérés avec succès',
  })
  @ApiResponse({ status: 404, description: 'Dossier non trouvé' })
  async findOne(@Param('id') id: string) {
    return this.dossiersService.findOne(id);
  }

  @Post()
  @ApiOperation({
    summary: 'Créer un nouveau dossier (associer client et responsable)',
  })
  @ApiResponse({ status: 201, description: 'Dossier créé avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  create(
    @Body() createDossierDto: CreateDossierDto,
    @Query('etape') etape?: number,
  ) {
    return this.dossiersService.create(createDossierDto, etape);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Modifier un dossier existant' })
  @ApiParam({ name: 'id', description: 'ID du dossier à modifier' })
  @ApiResponse({ status: 200, description: 'Dossier modifié avec succès' })
  @ApiResponse({ status: 404, description: 'Dossier non trouvé' })
  async update(
    @Param('id') id: string,
    @Body() updateDossierDto: UpdateDossierDto,
    @User('id') userId: string,
  ) {
    return this.dossiersService.update(id, updateDossierDto, userId);
  }
  @Patch(':id/status')
  @ApiOperation({ summary: "Changer le statut d'un dossier" })
  @ApiParam({ name: 'id', description: 'ID du dossier' })
  @ApiResponse({
    status: 200,
    description: 'Statut du dossier modifié avec succès',
  })
  @ApiResponse({ status: 404, description: 'Dossier non trouvé' })
  async updateStatus(
    @Param('id') id: string,
    @Body() body: UpdateDossierStatusDto,
  ) {
    return this.dossiersService.updateStatus(id, body.statut);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer (soft delete) un dossier' })
  @ApiParam({ name: 'id', description: 'ID du dossier à supprimer' })
  @ApiResponse({ status: 200, description: 'Dossier supprimé avec succès' })
  @ApiResponse({ status: 404, description: 'Dossier non trouvé' })
  async softDelete(@Param('id') id: string, @User('id') userId: string) {
    return this.dossiersService.softDelete(id, userId);
  }

  // Actions en masse
  @Delete('bulk')
  @ApiOperation({ summary: 'Suppression en masse (soft delete) de dossiers' })
  @ApiResponse({ status: 200, description: 'Dossiers supprimés avec succès' })
  @ApiResponse({
    status: 404,
    description: 'Un ou plusieurs dossiers non trouvés',
  })
  async bulkSoftDelete(
    @Body() bulkActionDto: BulkActionDto,
    @User('id') userId: string,
  ) {
    return this.dossiersService.bulkSoftDelete(
      bulkActionDto.dossierIds,
      userId,
    );
  }

  @Patch('bulk/archive')
  @ApiOperation({ summary: 'Archivage en masse de dossiers' })
  @ApiResponse({ status: 200, description: 'Dossiers archivés avec succès' })
  @ApiResponse({
    status: 404,
    description: 'Un ou plusieurs dossiers non trouvés',
  })
  async bulkArchive(
    @Body() bulkActionDto: BulkActionDto,
    @User('id') userId: string,
  ) {
    return this.dossiersService.bulkArchive(bulkActionDto.dossierIds, userId);
  }

  @Patch('bulk/assign')
  @ApiOperation({ summary: 'Réassignation en masse de dossiers' })
  @ApiResponse({ status: 200, description: 'Dossiers réassignés avec succès' })
  @ApiResponse({
    status: 404,
    description: "Un ou plusieurs dossiers ou l'utilisateur non trouvé",
  })
  async bulkAssign(
    @Body() bulkAssignDto: BulkAssignDto,
    @User('id') userId: string,
  ) {
    return this.dossiersService.bulkAssign(
      bulkAssignDto.dossierIds,
      bulkAssignDto.nouveauResponsableId,
      userId,
    );
  }

  @Post('export')
  @ApiOperation({
    summary: 'Exporter les dossiers au format Excel ou PDF',
    description:
      "Génère un fichier d'export des dossiers selon les filtres appliqués et le retourne sous forme d'URL Cloudinary",
  })
  @ApiBody({ type: ExportDossiersDto })
  @ApiResponse({
    status: 200,
    description: 'Export généré avec succès',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Export excel généré avec succès' },
        fileUrl: {
          type: 'string',
          example:
            'https://res.cloudinary.com/.../exports/dossiers_2023-11-15_abc123.xlsx',
        },
        filename: {
          type: 'string',
          example: 'dossiers_2023-11-15_abc123.xlsx',
        },
        format: { type: 'string', example: 'excel' },
        count: { type: 'number', example: 25 },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: "Erreur lors de la génération de l'export",
  })
  async exportDossiers(
    @Body() exportDto: ExportDossiersDto,
    @Query() filters: FilterDossierDto,
    @User('id') userId: string,
  ) {
    try {
      const result = await this.dossiersService.exportDossiers(
        filters,
        exportDto.format,
        userId,
      );
      return {
        message: result.message,
        fileUrl: result.fileUrl,
        filename: result.filename,
        format: result.format,
        count: result.count,
      };
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : "Erreur lors de la génération de l'export",
      );
    }
  }

  // ... autres méthodes existantes
  @Get(':id/documents')
  @ApiOperation({
    summary: 'Récupérer tous les documents attachés à un dossier',
  })
  @ApiParam({ name: 'id', description: 'ID du dossier' })
  async getDocuments(@Param('id') id: string) {
    return this.dossiersService.findDocuments(id);
  }

  @Get(':id/tasks')
  @ApiOperation({
    summary: 'Récupérer toutes les tâches liées à un dossier (actives)',
  })
  @ApiParam({ name: 'id', description: 'ID du dossier' })
  async getTasks(@Param('id') id: string) {
    return this.dossiersService.findTasks(id);
  }

  @Get(':id/calendar')
  @ApiOperation({
    summary: 'Récupérer tous les événements/rappels liés à un dossier',
  })
  @ApiParam({ name: 'id', description: 'ID du dossier' })
  async getCalendarEvents(@Param('id') id: string) {
    return this.dossiersService.findCalendarEvents(id);
  }

  @Get(':id/chat')
  @ApiOperation({
    summary:
      'Récupérer les messages du chat liés à un dossier (pagination pour scroll infini)',
  })
  @ApiParam({ name: 'id', description: 'ID du dossier' })
  @ApiQuery({
    name: 'skip',
    required: false,
    type: Number,
    description: 'Nombre de messages à ignorer',
  })
  @ApiQuery({
    name: 'take',
    required: false,
    type: Number,
    description: 'Nombre de messages à récupérer',
  })
  async getChatMessages(
    @Param('id') id: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    const skipNum = skip ? parseInt(skip, 10) : 0;
    const takeNum = take ? parseInt(take, 10) : 20;
    return this.dossiersService.findChatMessagesPaginated(id, skipNum, takeNum);
  }

  @Get(':id/notes')
  @ApiOperation({
    summary:
      'Récupérer toutes les notes internes actives liées à un dossier (pagination possible)',
  })
  @ApiParam({ name: 'id', description: 'ID du dossier' })
  @ApiQuery({
    name: 'skip',
    required: false,
    type: Number,
    description: 'Nombre de notes à ignorer',
  })
  @ApiQuery({
    name: 'take',
    required: false,
    type: Number,
    description: 'Nombre de notes à récupérer',
  })
  async getNotes(
    @Param('id') id: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    const skipNum = skip ? parseInt(skip, 10) : 0;
    const takeNum = take ? parseInt(take, 10) : 20;
    return this.dossiersService.findNotesPaginated(id, skipNum, takeNum);
  }

  @Post(':id/notes')
  @ApiOperation({ summary: 'Ajouter une note interne à un dossier' })
  @ApiParam({ name: 'id', description: 'ID du dossier' })
  async addNote(
    @Param('id') dossierId: string,
    @Body() createNoteDto: CreateDossierNoteDto,
    @User('id') utilisateurId: string,
  ) {
    return this.dossiersService.addNote(
      dossierId,
      createNoteDto,
      utilisateurId,
    );
  }

  @Put(':id/notes/:noteId')
  @ApiOperation({ summary: 'Modifier une note interne' })
  @ApiParam({ name: 'id', description: 'ID du dossier' })
  @ApiParam({ name: 'noteId', description: 'ID de la note' })
  async updateNote(
    @Param('id') dossierId: string,
    @Param('noteId') noteId: string,
    @Body() updateNoteDto: UpdateDossierNoteDto,
  ) {
    return this.dossiersService.updateNote(dossierId, noteId, updateNoteDto);
  }

  @Delete(':id/notes/:noteId')
  @ApiOperation({ summary: 'Supprimer une note interne (soft delete)' })
  @ApiParam({ name: 'id', description: 'ID du dossier' })
  @ApiParam({ name: 'noteId', description: 'ID de la note' })
  async deleteNote(
    @Param('id') dossierId: string,
    @Param('noteId') noteId: string,
  ) {
    return this.dossiersService.softDeleteNote(dossierId, noteId);
  }

  @Get(':id/events')
  @ApiOperation({
    summary: 'Récupérer tous les événements assignés à un dossier',
  })
  @ApiParam({ name: 'id', description: 'ID du dossier' })
  async getEvents(@Param('id') id: string) {
    return this.dossiersService.findEvents(id);
  }

  @Patch(':id/assign')
  @ApiOperation({ summary: 'Réassigner un dossier à un autre utilisateur' })
  @ApiParam({ name: 'id', description: 'ID du dossier' })
  async assignDossier(
    @Param('id') id: string,
    @Body() assignDto: AssignDossierDto,
  ) {
    return this.dossiersService.assignDossier(
      id,
      assignDto.nouveauResponsableId,
    );
  }

  @Post(':id/documents')
  @UseInterceptors(FilesInterceptor('files'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Upload de plusieurs documents liés à un dossier',
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
    },
  })
  uploadDocuments(
    @Param('id') dossierId: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: any,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const utilisateurId = req.user?.id || 'system';
    return this.dossiersService.addDocumentsToDossier(
      dossierId,
      files,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      utilisateurId,
    );
  }
  @Get('archives')
  @ApiOperation({ summary: 'Liste des dossiers archivés' })
  @ApiResponse({
    status: 200,
    description: 'Liste des dossiers archivés récupérée avec succès',
  })
  async getArchivedDossiers(@Query() filters: FilterDossierDto) {
    return this.dossiersService.findAll({ ...filters, statut: 'ARCHIVE' });
  }

  @Patch(':id/restore')
  @ApiOperation({ summary: 'Restaurer un dossier archivé' })
  @ApiParam({ name: 'id', description: 'ID du dossier à restaurer' })
  @ApiResponse({ status: 200, description: 'Dossier restauré avec succès' })
  @ApiResponse({
    status: 404,
    description: 'Dossier non trouvé ou non archivé',
  })
  restoreDossier(@Param('id') id: string, @User('id') userId: string) {
    return this.dossiersService.restoreDossier(id, userId);
  }

  @Patch(':id/archive')
  @ApiOperation({ summary: 'Archiver un dossier' })
  @ApiParam({ name: 'id', description: 'ID du dossier à archiver' })
  @ApiResponse({ status: 200, description: 'Dossier archivé avec succès' })
  @ApiResponse({ status: 404, description: 'Dossier non trouvé' })
  archiveDossier(@Param('id') id: string, @User('id') userId: string) {
    return this.dossiersService.archiveDossier(id, userId);
  }

  @Get(':id/audit')
  @ApiOperation({ summary: "Récupérer l'historique d'audit d'un dossier" })
  @ApiParam({ name: 'id', description: 'ID du dossier' })
  @ApiResponse({
    status: 200,
    description: "Historique d'audit récupéré avec succès",
  })
  async getAuditHistory(@Param('id') id: string) {
    return this.dossiersService.getAuditHistory(id);
  }

  @Get(':id/factures')
  @ApiOperation({ summary: 'Récupérer les factures liées à un dossier' })
  @ApiParam({ name: 'id', description: 'ID du dossier' })
  @ApiResponse({
    status: 200,
    description: 'Factures récupérées avec succès',
  })
  getFactures(@Param('id') id: string) {
    return this.dossiersService.getFactures(id);
  }

  @Post(':id/factures')
  @ApiOperation({ summary: 'Créer une facture pour un dossier' })
  @ApiParam({ name: 'id', description: 'ID du dossier' })
  @ApiResponse({ status: 201, description: 'Facture créée avec succès' })
  createFacture(
    @Param('id') dossierId: string,
    @Body() createFactureDto: CreateFactureDto,
  ) {
    return this.dossiersService.createFacture(dossierId, createFactureDto);
  }

  @Post(':id/tasks')
  @ApiOperation({ summary: 'Créer une tâche pour un dossier' })
  @ApiParam({ name: 'id', description: 'ID du dossier' })
  @ApiResponse({ status: 201, description: 'Tâche créée avec succès' })
  createTask(
    @Param('id') dossierId: string,
    @Body() createTaskDto: CreateTaskDto,
    @User('id') userId: string,
  ) {
    return this.dossiersService.createTask(dossierId, createTaskDto, userId);
  }

  @Post(':id/messages')
  @ApiOperation({ summary: "Envoyer un message dans le chat d'un dossier" })
  @ApiParam({ name: 'id', description: 'ID du dossier' })
  @ApiResponse({ status: 201, description: 'Message envoyé avec succès' })
  sendMessage(
    @Param('id') dossierId: string,
    @Body() messageDto: SendMessageDto,
    @User('id') userId: string,
  ) {
    return this.dossiersService.sendMessage(dossierId, messageDto, userId);
  }

  @Patch(':id/details')
  @ApiOperation({
    summary: "Mettre à jour les détails spécifiques d'un dossier",
  })
  @ApiParam({ name: 'id', description: 'ID du dossier' })
  @ApiResponse({ status: 200, description: 'Détails mis à jour avec succès' })
  updateSpecificDetails(
    @Param('id') id: string,
    @Body() updateDetailsDto: UpdateSpecificDetailsDto,
    @User('id') userId: string,
  ) {
    return this.dossiersService.updateSpecificDetails(
      id,
      updateDetailsDto.type,
      updateDetailsDto.detailsSpecifiques,
      userId,
    );
  }

  @Get(':id/export/pdf')
  @ApiOperation({ summary: 'Exporter un dossier au format PDF' })
  @ApiParam({ name: 'id', description: 'ID du dossier' })
  @ApiResponse({ status: 200, description: 'PDF généré avec succès' })
  exportDossierPDF(@Param('id') id: string, @User('id') userId: string) {
    return this.dossiersService.exportDossierPDF(id, userId);
  }
}
