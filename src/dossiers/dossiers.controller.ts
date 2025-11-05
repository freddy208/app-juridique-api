// src/dossiers/dossier.controller.ts
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
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { DossiersService } from './dossiers.service';
import { CreateDossierDto } from './dto/create-dossier.dto';
import { UpdateDossierDto } from './dto/update-dossier.dto';
import { QueryDossierDto } from './dto/query-dossier.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { RequirePermissions } from '../permissions/decorators/permissions.decorator';

@ApiTags('Dossiers')
@Controller('dossiers')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class DossiersController {
  constructor(private readonly dossiersService: DossiersService) {}

  @Post()
  @RequirePermissions('DOSSIERS.ecriture')
  @ApiOperation({ summary: 'Créer un nouveau dossier' })
  @ApiResponse({ status: 201, description: 'Dossier créé avec succès.' })
  create(@Body() createDossierDto: CreateDossierDto) {
    return this.dossiersService.create(createDossierDto);
  }

  @Get()
  @RequirePermissions('DOSSIERS.lecture')
  @ApiOperation({ summary: 'Lister tous les dossiers' })
  @ApiResponse({ status: 200, description: 'Liste des dossiers récupérée.' })
  findAll(@Query() query: QueryDossierDto) {
    return this.dossiersService.findAll(query);
  }

  @Get('stats')
  @RequirePermissions('DOSSIERS.lecture')
  @ApiOperation({ summary: 'Obtenir les statistiques des dossiers' })
  @ApiResponse({
    status: 200,
    description: 'Statistiques des dossiers récupérées.',
  })
  getStats() {
    return this.dossiersService.getStats();
  }

  @Get('client/:clientId')
  @RequirePermissions('DOSSIERS.lecture')
  @ApiOperation({ summary: "Lister les dossiers d'un client" })
  @ApiParam({ name: 'clientId', description: 'ID du client' })
  @ApiResponse({
    status: 200,
    description: 'Liste des dossiers du client récupérée.',
  })
  getDossiersByClient(
    @Param('clientId', ParseUUIDPipe) clientId: string,
    @Query() query: QueryDossierDto,
  ) {
    return this.dossiersService.getDossiersByClient(clientId, query);
  }

  @Get('responsable/:responsableId')
  @RequirePermissions('DOSSIERS.lecture')
  @ApiOperation({ summary: "Lister les dossiers d'un responsable" })
  @ApiParam({ name: 'responsableId', description: 'ID du responsable' })
  @ApiResponse({
    status: 200,
    description: 'Liste des dossiers du responsable récupérée.',
  })
  getDossiersByResponsable(
    @Param('responsableId', ParseUUIDPipe) responsableId: string,
    @Query() query: QueryDossierDto,
  ) {
    return this.dossiersService.getDossiersByResponsable(responsableId, query);
  }

  @Get('type/:type')
  @RequirePermissions('DOSSIERS.lecture')
  @ApiOperation({ summary: 'Lister les dossiers par type' })
  @ApiParam({ name: 'type', description: 'Type de dossier' })
  @ApiResponse({
    status: 200,
    description: 'Liste des dossiers par type récupérée.',
  })
  getDossiersByType(
    @Param('type') type: string,
    @Query() query: QueryDossierDto,
  ) {
    return this.dossiersService.getDossiersByType(type, query);
  }

  @Get('statut/:statut')
  @RequirePermissions('DOSSIERS.lecture')
  @ApiOperation({ summary: 'Lister les dossiers par statut' })
  @ApiParam({ name: 'statut', description: 'Statut du dossier' })
  @ApiResponse({
    status: 200,
    description: 'Liste des dossiers par statut récupérée.',
  })
  getDossiersByStatut(
    @Param('statut') statut: string,
    @Query() query: QueryDossierDto,
  ) {
    return this.dossiersService.getDossiersByStatut(statut, query);
  }

  @Get('en-cours')
  @RequirePermissions('DOSSIERS.lecture')
  @ApiOperation({ summary: 'Lister les dossiers en cours' })
  @ApiResponse({
    status: 200,
    description: 'Liste des dossiers en cours récupérée.',
  })
  getDossiersEnCours(@Query() query: QueryDossierDto) {
    return this.dossiersService.getDossiersEnCours(query);
  }

  @Get('clos')
  @RequirePermissions('DOSSIERS.lecture')
  @ApiOperation({ summary: 'Lister les dossiers clos' })
  @ApiResponse({
    status: 200,
    description: 'Liste des dossiers clos récupérée.',
  })
  getDossiersClos(@Query() query: QueryDossierDto) {
    return this.dossiersService.getDossiersClos(query);
  }

  @Get('archives')
  @RequirePermissions('DOSSIERS.lecture')
  @ApiOperation({ summary: 'Lister les dossiers archivés' })
  @ApiResponse({
    status: 200,
    description: 'Liste des dossiers archivés récupérée.',
  })
  getDossiersArchives(@Query() query: QueryDossierDto) {
    return this.dossiersService.getDossiersArchives(query);
  }

  @Get(':id')
  @RequirePermissions('DOSSIERS.lecture')
  @ApiOperation({ summary: 'Récupérer un dossier par son ID' })
  @ApiParam({ name: 'id', description: 'ID du dossier' })
  @ApiResponse({ status: 200, description: 'Détails du dossier récupérés.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.dossiersService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions('DOSSIERS.ecriture')
  @ApiOperation({ summary: 'Mettre à jour un dossier' })
  @ApiParam({ name: 'id', description: 'ID du dossier' })
  @ApiResponse({ status: 200, description: 'Dossier mis à jour.' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDossierDto: UpdateDossierDto,
  ) {
    return this.dossiersService.update(id, updateDossierDto);
  }

  @Patch(':id/statut')
  @RequirePermissions('DOSSIERS.ecriture')
  @ApiOperation({ summary: "Changer le statut d'un dossier" })
  @ApiParam({ name: 'id', description: 'ID du dossier' })
  @ApiResponse({ status: 200, description: 'Statut du dossier changé.' })
  changerStatut(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('statut') statut: string,
  ) {
    return this.dossiersService.changerStatut(id, statut);
  }

  @Patch(':id/responsable')
  @RequirePermissions('DOSSIERS.ecriture')
  @ApiOperation({ summary: 'Assigner un responsable à un dossier' })
  @ApiParam({ name: 'id', description: 'ID du dossier' })
  @ApiResponse({ status: 200, description: 'Responsable assigné au dossier.' })
  assignerResponsable(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('responsableId') responsableId: string,
  ) {
    return this.dossiersService.assignerResponsable(id, responsableId);
  }

  @Delete(':id')
  @RequirePermissions('DOSSIERS.suppression')
  @ApiOperation({ summary: 'Supprimer un dossier' })
  @ApiParam({ name: 'id', description: 'ID du dossier' })
  @ApiResponse({ status: 200, description: 'Dossier supprimé.' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.dossiersService.remove(id);
  }
}
