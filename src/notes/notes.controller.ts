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
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { NotesService } from './notes.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { RequirePermissions } from '../permissions/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { QueryNotesDto } from './dto/filter-note.dto';

@ApiTags('Notes')
@Controller('notes')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Post()
  @RequirePermissions('NOTES.ecriture')
  @ApiOperation({ summary: 'Créer une nouvelle note' })
  @ApiResponse({ status: 201, description: 'Note créée avec succès' })
  @ApiResponse({
    status: 400,
    description: 'Une note doit être associée à un client ou un dossier',
  })
  @ApiResponse({
    status: 404,
    description: 'Client ou dossier non trouvé',
  })
  create(
    @Body() createNoteDto: CreateNoteDto,
    @CurrentUser('id') utilisateurId: string,
  ) {
    return this.notesService.create(createNoteDto, utilisateurId);
  }

  @Get()
  @RequirePermissions('NOTES.lecture')
  @ApiOperation({ summary: 'Récupérer la liste des notes' })
  @ApiResponse({
    status: 200,
    description: 'Liste des notes récupérée avec succès',
  })
  findAll(@Query() query: QueryNotesDto) {
    return this.notesService.findAll(query);
  }

  @Get('search')
  @RequirePermissions('NOTES.lecture')
  @ApiOperation({ summary: 'Rechercher des notes' })
  @ApiQuery({ name: 'q', description: 'Terme de recherche', required: true })
  @ApiResponse({ status: 200, description: 'Résultats de la recherche' })
  searchNotes(@Query('q') searchTerm: string, @Query() query: QueryNotesDto) {
    return this.notesService.searchNotes(searchTerm, query);
  }

  @Get('stats')
  @RequirePermissions('NOTES.lecture')
  @ApiOperation({ summary: 'Récupérer les statistiques des notes' })
  @ApiResponse({
    status: 200,
    description: 'Statistiques récupérées avec succès',
  })
  getStats(@CurrentUser('id') utilisateurId?: string) {
    return this.notesService.getStats(utilisateurId);
  }

  @Get(':id')
  @RequirePermissions('NOTES.lecture')
  @ApiOperation({ summary: "Récupérer les détails d'une note" })
  @ApiParam({ name: 'id', description: 'ID de la note' })
  @ApiResponse({
    status: 200,
    description: 'Détails de la note récupérés avec succès',
  })
  @ApiResponse({
    status: 404,
    description: 'Note non trouvée',
  })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.notesService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions('NOTES.ecriture')
  @ApiOperation({ summary: 'Mettre à jour une note' })
  @ApiParam({ name: 'id', description: 'ID de la note' })
  @ApiResponse({
    status: 200,
    description: 'Note mise à jour avec succès',
  })
  @ApiResponse({
    status: 400,
    description: 'Une note doit être associée à un client ou un dossier',
  })
  @ApiResponse({
    status: 404,
    description: 'Note non trouvée',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateNoteDto: UpdateNoteDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.notesService.update(id, updateNoteDto, userId);
  }

  @Delete(':id')
  @RequirePermissions('NOTES.suppression')
  @ApiOperation({ summary: 'Supprimer une note' })
  @ApiParam({ name: 'id', description: 'ID de la note' })
  @ApiResponse({
    status: 200,
    description: 'Note supprimée avec succès',
  })
  @ApiResponse({
    status: 404,
    description: 'Note non trouvée',
  })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.notesService.remove(id);
  }

  // -------------------- ENDPOINTS SPÉCIFIQUES --------------------
  @Get('client/:clientId')
  @RequirePermissions('NOTES.lecture')
  @ApiOperation({ summary: "Récupérer les notes d'un client" })
  @ApiParam({ name: 'clientId', description: 'ID du client' })
  @ApiResponse({
    status: 200,
    description: 'Notes du client récupérées avec succès',
  })
  @ApiResponse({
    status: 404,
    description: 'Client non trouvé',
  })
  getNotesByClient(
    @Param('clientId', ParseUUIDPipe) clientId: string,
    @Query() query: QueryNotesDto,
  ) {
    return this.notesService.getNotesByClient(clientId, query);
  }

  @Get('dossier/:dossierId')
  @RequirePermissions('NOTES.lecture')
  @ApiOperation({ summary: "Récupérer les notes d'un dossier" })
  @ApiParam({ name: 'dossierId', description: 'ID du dossier' })
  @ApiResponse({
    status: 200,
    description: 'Notes du dossier récupérées avec succès',
  })
  @ApiResponse({
    status: 404,
    description: 'Dossier non trouvé',
  })
  getNotesByDossier(
    @Param('dossierId', ParseUUIDPipe) dossierId: string,
    @Query() query: QueryNotesDto,
  ) {
    return this.notesService.getNotesByDossier(dossierId, query);
  }

  @Get('utilisateur/:utilisateurId')
  @RequirePermissions('NOTES.lecture')
  @ApiOperation({ summary: "Récupérer les notes d'un utilisateur" })
  @ApiParam({ name: 'utilisateurId', description: "ID de l'utilisateur" })
  @ApiResponse({
    status: 200,
    description: "Notes de l'utilisateur récupérées avec succès",
  })
  @ApiResponse({
    status: 404,
    description: 'Utilisateur non trouvé',
  })
  getNotesByUtilisateur(
    @Param('utilisateurId', ParseUUIDPipe) utilisateurId: string,
    @Query() query: QueryNotesDto,
  ) {
    return this.notesService.getNotesByUtilisateur(utilisateurId, query);
  }

  // -------------------- ENDPOINTS POUR L'UTILISATEUR CONNECTÉ --------------------
  @Get('profile/me')
  @ApiOperation({ summary: "Récupérer les notes de l'utilisateur connecté" })
  @ApiResponse({ status: 200, description: 'Notes récupérées avec succès' })
  getMyNotes(
    @Query() query: QueryNotesDto,
    @CurrentUser('id') utilisateurId: string,
  ) {
    return this.notesService.getNotesByUtilisateur(utilisateurId, query);
  }

  @Get('profile/me/stats')
  @ApiOperation({
    summary: "Récupérer les statistiques de notes de l'utilisateur connecté",
  })
  @ApiResponse({
    status: 200,
    description: 'Statistiques récupérées avec succès',
  })
  getMyStats(@CurrentUser('id') utilisateurId: string) {
    return this.notesService.getStats(utilisateurId);
  }
}
