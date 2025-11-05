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
import { CreateEvenementDto } from './dto/create-evenement.dto';
import { UpdateEvenementDto } from './dto/update-evenement.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { RequirePermissions } from '../permissions/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ParseUUIDPipe } from '../common/pipes/parse-uuid.pipe';
import { StatutEvenement } from '@prisma/client';
import { QueryEvenementsDto } from './dto/filter-evenement.dto';
import { EvenementsService } from './evenement-calendrier.service';

@ApiTags('Événements')
@Controller('evenements')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class EvenementsController {
  constructor(private readonly evenementsService: EvenementsService) {}

  @Post()
  @RequirePermissions('EVENEMENTS.ecriture')
  @ApiOperation({ summary: 'Créer un nouvel événement' })
  @ApiResponse({ status: 201, description: 'Événement créé avec succès' })
  @ApiResponse({
    status: 404,
    description: 'Dossier ou utilisateur non trouvé',
  })
  create(
    @Body() createEvenementDto: CreateEvenementDto,
    @CurrentUser('id') creeParId: string,
  ) {
    return this.evenementsService.create(createEvenementDto, creeParId);
  }

  @Get()
  @RequirePermissions('EVENEMENTS.lecture')
  @ApiOperation({ summary: 'Récupérer la liste des événements' })
  @ApiResponse({
    status: 200,
    description: 'Liste des événements récupérée avec succès',
  })
  findAll(@Query() query: QueryEvenementsDto) {
    return this.evenementsService.findAll(query);
  }

  @Get('search')
  @RequirePermissions('EVENEMENTS.lecture')
  @ApiOperation({ summary: 'Rechercher des événements' })
  @ApiQuery({ name: 'q', description: 'Terme de recherche', required: true })
  @ApiResponse({ status: 200, description: 'Résultats de la recherche' })
  searchEvenements(
    @Query('q') searchTerm: string,
    @Query() query: QueryEvenementsDto,
  ) {
    return this.evenementsService.searchEvenements(searchTerm, query);
  }

  @Get('stats')
  @RequirePermissions('EVENEMENTS.lecture')
  @ApiOperation({ summary: 'Récupérer les statistiques des événements' })
  @ApiResponse({
    status: 200,
    description: 'Statistiques récupérées avec succès',
  })
  getStats(@CurrentUser('id') utilisateurId?: string) {
    return this.evenementsService.getStats(utilisateurId);
  }

  @Get('aujourd-hui')
  @RequirePermissions('EVENEMENTS.lecture')
  @ApiOperation({ summary: "Récupérer les événements d'aujourd'hui" })
  @ApiResponse({
    status: 200,
    description: "Événements d'aujourd'hui récupérés avec succès",
  })
  getEvenementsAujourdHui(@Query() query: QueryEvenementsDto) {
    return this.evenementsService.getEvenementsAujourdHui(query);
  }

  @Get('cette-semaine')
  @RequirePermissions('EVENEMENTS.lecture')
  @ApiOperation({ summary: 'Récupérer les événements de cette semaine' })
  @ApiResponse({
    status: 200,
    description: 'Événements de cette semaine récupérés avec succès',
  })
  getEvenementsCetteSemaine(@Query() query: QueryEvenementsDto) {
    return this.evenementsService.getEvenementsCetteSemaine(query);
  }

  @Get('ce-mois')
  @RequirePermissions('EVENEMENTS.lecture')
  @ApiOperation({ summary: 'Récupérer les événements de ce mois' })
  @ApiResponse({
    status: 200,
    description: 'Événements de ce mois récupérés avec succès',
  })
  getEvenementsCeMois(@Query() query: QueryEvenementsDto) {
    return this.evenementsService.getEvenementsCeMois(query);
  }

  @Get('a-venir')
  @RequirePermissions('EVENEMENTS.lecture')
  @ApiOperation({ summary: 'Récupérer les événements à venir' })
  @ApiResponse({
    status: 200,
    description: 'Événements à venir récupérés avec succès',
  })
  getEvenementsAVenir(@Query() query: QueryEvenementsDto) {
    return this.evenementsService.getEvenementsAVenir(query);
  }

  @Get(':id')
  @RequirePermissions('EVENEMENTS.lecture')
  @ApiOperation({ summary: "Récupérer les détails d'un événement" })
  @ApiParam({ name: 'id', description: "ID de l'événement" })
  @ApiResponse({
    status: 200,
    description: "Détails de l'événement récupérés avec succès",
  })
  @ApiResponse({
    status: 404,
    description: 'Événement non trouvé',
  })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.evenementsService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions('EVENEMENTS.ecriture')
  @ApiOperation({ summary: 'Mettre à jour un événement' })
  @ApiParam({ name: 'id', description: "ID de l'événement" })
  @ApiResponse({
    status: 200,
    description: 'Événement mis à jour avec succès',
  })
  @ApiResponse({
    status: 404,
    description: 'Événement non trouvé',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateEvenementDto: UpdateEvenementDto,
  ) {
    return this.evenementsService.update(id, updateEvenementDto);
  }

  @Patch(':id/statut')
  @RequirePermissions('EVENEMENTS.ecriture')
  @ApiOperation({ summary: "Changer le statut d'un événement" })
  @ApiParam({ name: 'id', description: "ID de l'événement" })
  @ApiResponse({
    status: 200,
    description: "Statut de l'événement mis à jour avec succès",
  })
  @ApiResponse({
    status: 404,
    description: 'Événement non trouvé',
  })
  changerStatutEvenement(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('statut') statut: StatutEvenement,
  ) {
    return this.evenementsService.changerStatutEvenement(id, statut);
  }

  @Delete(':id')
  @RequirePermissions('EVENEMENTS.suppression')
  @ApiOperation({ summary: 'Supprimer un événement' })
  @ApiParam({ name: 'id', description: "ID de l'événement" })
  @ApiResponse({
    status: 200,
    description: 'Événement supprimé avec succès',
  })
  @ApiResponse({
    status: 404,
    description: 'Événement non trouvé',
  })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.evenementsService.remove(id);
  }

  // -------------------- ENDPOINTS SPÉCIFIQUES --------------------
  @Get('dossier/:dossierId')
  @RequirePermissions('EVENEMENTS.lecture')
  @ApiOperation({ summary: "Récupérer les événements d'un dossier" })
  @ApiParam({ name: 'dossierId', description: 'ID du dossier' })
  @ApiResponse({
    status: 200,
    description: 'Événements du dossier récupérés avec succès',
  })
  @ApiResponse({
    status: 404,
    description: 'Dossier non trouvé',
  })
  getEvenementsByDossier(
    @Param('dossierId', ParseUUIDPipe) dossierId: string,
    @Query() query: QueryEvenementsDto,
  ) {
    return this.evenementsService.getEvenementsByDossier(dossierId, query);
  }

  @Get('createur/:creeParId')
  @RequirePermissions('EVENEMENTS.lecture')
  @ApiOperation({
    summary: 'Récupérer les événements créés par un utilisateur',
  })
  @ApiParam({ name: 'creeParId', description: 'ID du créateur' })
  @ApiResponse({
    status: 200,
    description: 'Événements du créateur récupérés avec succès',
  })
  @ApiResponse({
    status: 404,
    description: 'Utilisateur non trouvé',
  })
  getEvenementsByCreateur(
    @Param('creeParId', ParseUUIDPipe) creeParId: string,
    @Query() query: QueryEvenementsDto,
  ) {
    return this.evenementsService.getEvenementsByCreateur(creeParId, query);
  }

  // -------------------- ENDPOINTS POUR L'UTILISATEUR CONNECTÉ --------------------
  @Get('profile/me')
  @ApiOperation({
    summary: "Récupérer les événements de l'utilisateur connecté",
  })
  @ApiResponse({ status: 200, description: 'Événements récupérés avec succès' })
  getMyEvenements(
    @Query() query: QueryEvenementsDto,
    @CurrentUser('id') utilisateurId: string,
  ) {
    return this.evenementsService.getEvenementsByCreateur(utilisateurId, query);
  }

  @Get('profile/me/aujourd-hui')
  @ApiOperation({
    summary: "Récupérer les événements d'aujourd'hui de l'utilisateur connecté",
  })
  @ApiResponse({
    status: 200,
    description: "Événements d'aujourd'hui récupérés avec succès",
  })
  getMyEvenementsAujourdHui(
    @Query() query: QueryEvenementsDto,
    @CurrentUser('id') utilisateurId: string,
  ) {
    return this.evenementsService.getEvenementsAujourdHui({
      ...query,
      creeParId: utilisateurId,
    });
  }

  @Get('profile/me/a-venir')
  @ApiOperation({
    summary: "Récupérer les événements à venir de l'utilisateur connecté",
  })
  @ApiResponse({
    status: 200,
    description: 'Événements à venir récupérés avec succès',
  })
  getMyEvenementsAVenir(
    @Query() query: QueryEvenementsDto,
    @CurrentUser('id') utilisateurId: string,
  ) {
    return this.evenementsService.getEvenementsAVenir({
      ...query,
      creeParId: utilisateurId,
    });
  }

  @Get('profile/me/stats')
  @ApiOperation({
    summary:
      "Récupérer les statistiques d'événements de l'utilisateur connecté",
  })
  @ApiResponse({
    status: 200,
    description: 'Statistiques récupérées avec succès',
  })
  getMyStats(@CurrentUser('id') utilisateurId: string) {
    return this.evenementsService.getStats(utilisateurId);
  }
}
