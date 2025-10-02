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
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { DossiersService } from './dossiers.service';
import { FilterDossierDto } from './dto/filter-dossier.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateDossierDto } from './dto/create-dossier.dto';
import { UpdateDossierDto } from './dto/update-dossier.dto';
import { UpdateDossierStatusDto } from './dto/update-dossier-status.dto';
import { Request } from 'express';
import { User } from '../auth/decorators/user.decorator';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { AssignDossierDto } from './dto/assign-dossier.dto';

@ApiTags('dossiers')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('dossiers')
export class DossiersController {
  constructor(private readonly dossiersService: DossiersService) {}

  @Get()
  @ApiOperation({ summary: 'Liste des dossiers avec filtres' })
  async findAll(@Query() filters: FilterDossierDto) {
    return this.dossiersService.findAll(filters);
  }
  // ✅ Nouveau : détails d’un dossier
  @Get(':id')
  @ApiOperation({ summary: 'Détails d’un dossier par ID' })
  @ApiParam({ name: 'id', description: 'ID du dossier' })
  async findOne(@Param('id') id: string) {
    return this.dossiersService.findOne(id);
  }
  // ✅ Nouveau : créer un dossier
  @Post()
  @ApiOperation({
    summary: 'Créer un nouveau dossier (associer client et responsable)',
  })
  create(@Body() createDossierDto: CreateDossierDto) {
    return this.dossiersService.create(createDossierDto);
  }
  @Put(':id')
  @ApiOperation({ summary: 'Modifier un dossier existant' })
  @ApiParam({ name: 'id', description: 'ID du dossier à modifier' })
  async update(
    @Param('id') id: string,
    @Body() updateDossierDto: UpdateDossierDto,
  ) {
    return this.dossiersService.update(id, updateDossierDto);
  }
  @Patch(':id/status')
  @ApiOperation({ summary: 'Changer le statut d’un dossier' })
  @ApiParam({ name: 'id', description: 'ID du dossier' })
  async updateStatus(
    @Param('id') id: string,
    @Body() body: UpdateDossierStatusDto,
  ) {
    return this.dossiersService.updateStatus(id, body.statut);
  }
  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer (soft delete) un dossier' })
  @ApiParam({ name: 'id', description: 'ID du dossier à supprimer' })
  async softDelete(
    @Param('id') id: string,
    @User('userId') userId: string, // ✅ propre, typé, clair
  ) {
    return this.dossiersService.softDelete(id, userId);
  }
  // src/dossiers/dossiers.controller.ts
  @Get(':id/documents')
  @ApiOperation({
    summary: 'Récupérer tous les documents attachés à un dossier',
  })
  @ApiParam({ name: 'id', description: 'ID du dossier' })
  async getDocuments(@Param('id') id: string) {
    return this.dossiersService.findDocuments(id);
  }
  // src/dossiers/dossiers.controller.ts
  @Get(':id/tasks')
  @ApiOperation({
    summary: 'Récupérer toutes les tâches liées à un dossier (actives)',
  })
  @ApiParam({ name: 'id', description: 'ID du dossier' })
  async getTasks(@Param('id') id: string) {
    return this.dossiersService.findTasks(id);
  }
  // src/dossiers/dossiers.controller.ts
  @Get(':id/calendar')
  @ApiOperation({
    summary: 'Récupérer tous les événements/rappels liés à un dossier',
  })
  @ApiParam({ name: 'id', description: 'ID du dossier' })
  async getCalendarEvents(@Param('id') id: string) {
    return this.dossiersService.findCalendarEvents(id);
  }
  // src/dossiers/dossiers.controller.ts
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
    const takeNum = take ? parseInt(take, 10) : 20; // par défaut 20 messages
    return this.dossiersService.findChatMessagesPaginated(id, skipNum, takeNum);
  }
  // src/dossiers/dossiers.controller.ts
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
  // Ajouter une note
  @Post(':id/notes')
  @ApiOperation({ summary: 'Ajouter une note interne à un dossier' })
  @ApiParam({ name: 'id', description: 'ID du dossier' })
  async addNote(
    @Param('id') dossierId: string,
    @Body() createNoteDto: CreateNoteDto,
    @User('id') utilisateurId: string,
  ) {
    return this.dossiersService.addNote(
      dossierId,
      createNoteDto,
      utilisateurId,
    );
  }

  // Modifier une note
  @Put(':id/notes/:noteId')
  @ApiOperation({ summary: 'Modifier une note interne' })
  @ApiParam({ name: 'id', description: 'ID du dossier' })
  @ApiParam({ name: 'noteId', description: 'ID de la note' })
  async updateNote(
    @Param('id') dossierId: string,
    @Param('noteId') noteId: string,
    @Body() updateNoteDto: UpdateNoteDto,
  ) {
    return this.dossiersService.updateNote(dossierId, noteId, updateNoteDto);
  }

  // Supprimer une note (soft delete)
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
  // src/dossiers/dossiers.controller.ts
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
}
