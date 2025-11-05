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
import { TachesService } from './taches.service';
import { CreateTacheDto } from './dto/create-tache.dto';
import { UpdateTacheDto } from './dto/update-tache.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { RequirePermissions } from '../permissions/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { StatutTache } from '@prisma/client';
import { QueryTachesDto } from './dto/filter-tache.dto';

@ApiTags('Tâches')
@Controller('taches')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class TachesController {
  constructor(private readonly tachesService: TachesService) {}

  @Post()
  @RequirePermissions('TACHES.ecriture')
  @ApiOperation({ summary: 'Créer une nouvelle tâche' })
  @ApiResponse({ status: 201, description: 'Tâche créée avec succès' })
  @ApiResponse({
    status: 404,
    description: 'Dossier ou utilisateur non trouvé',
  })
  create(
    @Body() createTacheDto: CreateTacheDto,
    @CurrentUser('id') creeParId: string,
  ) {
    return this.tachesService.create(createTacheDto, creeParId);
  }

  @Get()
  @RequirePermissions('TACHES.lecture')
  @ApiOperation({ summary: 'Récupérer la liste des tâches' })
  @ApiResponse({
    status: 200,
    description: 'Liste des tâches récupérée avec succès',
  })
  findAll(@Query() query: QueryTachesDto) {
    return this.tachesService.findAll(query);
  }

  @Get('search')
  @RequirePermissions('TACHES.lecture')
  @ApiOperation({ summary: 'Rechercher des tâches' })
  @ApiQuery({ name: 'q', description: 'Terme de recherche', required: true })
  @ApiResponse({ status: 200, description: 'Résultats de la recherche' })
  searchTaches(@Query('q') searchTerm: string, @Query() query: QueryTachesDto) {
    return this.tachesService.searchTaches(searchTerm, query);
  }

  @Get('stats')
  @RequirePermissions('TACHES.lecture')
  @ApiOperation({ summary: 'Récupérer les statistiques des tâches' })
  @ApiResponse({
    status: 200,
    description: 'Statistiques récupérées avec succès',
  })
  getStats(@CurrentUser('id') utilisateurId?: string) {
    return this.tachesService.getStats(utilisateurId);
  }

  @Get('en-retard')
  @RequirePermissions('TACHES.lecture')
  @ApiOperation({ summary: 'Récupérer les tâches en retard' })
  @ApiResponse({
    status: 200,
    description: 'Tâches en retard récupérées avec succès',
  })
  getTachesEnRetard(@Query() query: QueryTachesDto) {
    return this.tachesService.getTachesEnRetard(query);
  }

  @Get('echeance-proche')
  @RequirePermissions('TACHES.lecture')
  @ApiOperation({ summary: 'Récupérer les tâches à échéance proche' })
  @ApiQuery({
    name: 'jours',
    description: "Nombre de jours avant l'échéance",
    required: false,
    default: 3,
  })
  @ApiResponse({
    status: 200,
    description: 'Tâches à échéance proche récupérées avec succès',
  })
  getTachesAEcheanceProche(
    @Query('jours') jours: number = 3,
    @Query() query: QueryTachesDto,
  ) {
    return this.tachesService.getTachesAEcheanceProche(jours, query);
  }

  @Get(':id')
  @RequirePermissions('TACHES.lecture')
  @ApiOperation({ summary: "Récupérer les détails d'une tâche" })
  @ApiParam({ name: 'id', description: 'ID de la tâche' })
  @ApiResponse({
    status: 200,
    description: 'Détails de la tâche récupérés avec succès',
  })
  @ApiResponse({
    status: 404,
    description: 'Tâche non trouvée',
  })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.tachesService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions('TACHES.ecriture')
  @ApiOperation({ summary: 'Mettre à jour une tâche' })
  @ApiParam({ name: 'id', description: 'ID de la tâche' })
  @ApiResponse({
    status: 200,
    description: 'Tâche mise à jour avec succès',
  })
  @ApiResponse({
    status: 404,
    description: 'Tâche non trouvée',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTacheDto: UpdateTacheDto,
  ) {
    return this.tachesService.update(id, updateTacheDto);
  }

  @Patch(':id/statut')
  @RequirePermissions('TACHES.ecriture')
  @ApiOperation({ summary: "Changer le statut d'une tâche" })
  @ApiParam({ name: 'id', description: 'ID de la tâche' })
  @ApiResponse({
    status: 200,
    description: 'Statut de la tâche mis à jour avec succès',
  })
  @ApiResponse({
    status: 404,
    description: 'Tâche non trouvée',
  })
  changerStatutTache(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('statut') statut: StatutTache,
  ) {
    return this.tachesService.changerStatutTache(id, statut);
  }

  @Patch(':id/assigner')
  @RequirePermissions('TACHES.ecriture')
  @ApiOperation({ summary: 'Assigner une tâche à un utilisateur' })
  @ApiParam({ name: 'id', description: 'ID de la tâche' })
  @ApiResponse({
    status: 200,
    description: 'Tâche assignée avec succès',
  })
  @ApiResponse({
    status: 404,
    description: 'Tâche ou utilisateur non trouvé',
  })
  assignerTache(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('assigneeId') assigneeId: string,
  ) {
    return this.tachesService.assignerTache(id, assigneeId);
  }

  @Delete(':id')
  @RequirePermissions('TACHES.suppression')
  @ApiOperation({ summary: 'Supprimer une tâche' })
  @ApiParam({ name: 'id', description: 'ID de la tâche' })
  @ApiResponse({
    status: 200,
    description: 'Tâche supprimée avec succès',
  })
  @ApiResponse({
    status: 404,
    description: 'Tâche non trouvée',
  })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.tachesService.remove(id);
  }

  // -------------------- ENDPOINTS SPÉCIFIQUES --------------------
  @Get('dossier/:dossierId')
  @RequirePermissions('TACHES.lecture')
  @ApiOperation({ summary: "Récupérer les tâches d'un dossier" })
  @ApiParam({ name: 'dossierId', description: 'ID du dossier' })
  @ApiResponse({
    status: 200,
    description: 'Tâches du dossier récupérées avec succès',
  })
  @ApiResponse({
    status: 404,
    description: 'Dossier non trouvé',
  })
  getTachesByDossier(
    @Param('dossierId', ParseUUIDPipe) dossierId: string,
    @Query() query: QueryTachesDto,
  ) {
    return this.tachesService.getTachesByDossier(dossierId, query);
  }

  @Get('assignee/:assigneeId')
  @RequirePermissions('TACHES.lecture')
  @ApiOperation({ summary: 'Récupérer les tâches assignées à un utilisateur' })
  @ApiParam({ name: 'assigneeId', description: "ID de l'utilisateur assigné" })
  @ApiResponse({
    status: 200,
    description: "Tâches de l'utilisateur récupérées avec succès",
  })
  @ApiResponse({
    status: 404,
    description: 'Utilisateur non trouvé',
  })
  getTachesByAssignee(
    @Param('assigneeId', ParseUUIDPipe) assigneeId: string,
    @Query() query: QueryTachesDto,
  ) {
    return this.tachesService.getTachesByAssignee(assigneeId, query);
  }

  @Get('createur/:creeParId')
  @RequirePermissions('TACHES.lecture')
  @ApiOperation({ summary: 'Récupérer les tâches créées par un utilisateur' })
  @ApiParam({ name: 'creeParId', description: 'ID du créateur' })
  @ApiResponse({
    status: 200,
    description: 'Tâches du créateur récupérées avec succès',
  })
  @ApiResponse({
    status: 404,
    description: 'Utilisateur non trouvé',
  })
  getTachesByCreateur(
    @Param('creeParId', ParseUUIDPipe) creeParId: string,
    @Query() query: QueryTachesDto,
  ) {
    return this.tachesService.getTachesByCreateur(creeParId, query);
  }

  // -------------------- ENDPOINTS POUR L'UTILISATEUR CONNECTÉ --------------------
  @Get('profile/me')
  @ApiOperation({ summary: "Récupérer les tâches de l'utilisateur connecté" })
  @ApiResponse({ status: 200, description: 'Tâches récupérées avec succès' })
  getMyTaches(
    @Query() query: QueryTachesDto,
    @CurrentUser('id') utilisateurId: string,
  ) {
    return this.tachesService.getTachesByAssignee(utilisateurId, query);
  }

  @Get('profile/me/en-retard')
  @ApiOperation({
    summary: "Récupérer les tâches en retard de l'utilisateur connecté",
  })
  @ApiResponse({
    status: 200,
    description: 'Tâches en retard récupérées avec succès',
  })
  getMyTachesEnRetard(
    @Query() query: QueryTachesDto,
    @CurrentUser('id') utilisateurId: string,
  ) {
    return this.tachesService.getTachesEnRetard({
      ...query,
      assigneeId: utilisateurId,
    });
  }

  @Get('profile/me/stats')
  @ApiOperation({
    summary: "Récupérer les statistiques de tâches de l'utilisateur connecté",
  })
  @ApiResponse({
    status: 200,
    description: 'Statistiques récupérées avec succès',
  })
  getMyStats(@CurrentUser('id') utilisateurId: string) {
    return this.tachesService.getStats(utilisateurId);
  }
}
