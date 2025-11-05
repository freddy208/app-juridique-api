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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JurisprudenceService } from './juriprudence.service';
import { CreateJurisprudenceDto } from './dto/create-jurisprudence.dto';
import { UpdateJurisprudenceDto } from './dto/update-jurisprudence.dto';
import { CreateDossierJurisprudenceDto } from './dto/create-dossier-jurisprudence.dto';
import { UpdateDossierJurisprudenceDto } from './dto/update-dossier-jurisprudence.dto';
import { QueryJurisprudenceDto } from './dto/query-jurisprudence.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { RequirePermissions } from '../permissions/decorators/permissions.decorator';
import { ParseUUIDPipe } from '../common/pipes/parse-uuid.pipe';

@ApiTags('Jurisprudence')
@Controller('jurisprudence')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class JurisprudenceController {
  constructor(private readonly jurisprudenceService: JurisprudenceService) {}

  // -------------------- GESTION DES JURISPRUDENCES --------------------
  @Post()
  @RequirePermissions('JURISPRUDENCE.ecriture')
  @ApiOperation({ summary: 'Créer une nouvelle jurisprudence' })
  @ApiResponse({ status: 201, description: 'Jurisprudence créée avec succès' })
  createJurisprudence(@Body() createJurisprudenceDto: CreateJurisprudenceDto) {
    return this.jurisprudenceService.createJurisprudence(
      createJurisprudenceDto,
    );
  }

  @Get()
  @RequirePermissions('JURISPRUDENCE.lecture')
  @ApiOperation({ summary: 'Récupérer la liste des jurisprudences' })
  @ApiResponse({
    status: 200,
    description: 'Liste des jurisprudences récupérée avec succès',
  })
  findAllJurisprudences(@Query() query: QueryJurisprudenceDto) {
    return this.jurisprudenceService.findAllJurisprudences(query);
  }

  @Get(':id')
  @RequirePermissions('JURISPRUDENCE.lecture')
  @ApiOperation({ summary: "Récupérer les détails d'une jurisprudence" })
  @ApiParam({ name: 'id', description: 'ID de la jurisprudence' })
  @ApiResponse({
    status: 200,
    description: 'Détails de la jurisprudence récupérés avec succès',
  })
  @ApiResponse({
    status: 404,
    description: 'Jurisprudence non trouvée',
  })
  findOneJurisprudence(@Param('id', ParseUUIDPipe) id: string) {
    return this.jurisprudenceService.findOneJurisprudence(id);
  }

  @Patch(':id')
  @RequirePermissions('JURISPRUDENCE.ecriture')
  @ApiOperation({ summary: 'Mettre à jour une jurisprudence' })
  @ApiParam({ name: 'id', description: 'ID de la jurisprudence' })
  @ApiResponse({
    status: 200,
    description: 'Jurisprudence mise à jour avec succès',
  })
  @ApiResponse({
    status: 404,
    description: 'Jurisprudence non trouvée',
  })
  updateJurisprudence(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateJurisprudenceDto: UpdateJurisprudenceDto,
  ) {
    return this.jurisprudenceService.updateJurisprudence(
      id,
      updateJurisprudenceDto,
    );
  }

  @Delete(':id')
  @RequirePermissions('JURISPRUDENCE.suppression')
  @ApiOperation({ summary: 'Supprimer une jurisprudence' })
  @ApiParam({ name: 'id', description: 'ID de la jurisprudence' })
  @ApiResponse({
    status: 200,
    description: 'Jurisprudence supprimée avec succès',
  })
  @ApiResponse({
    status: 404,
    description: 'Jurisprudence non trouvée',
  })
  removeJurisprudence(@Param('id', ParseUUIDPipe) id: string) {
    return this.jurisprudenceService.removeJurisprudence(id);
  }

  // -------------------- GESTION DES DOSSIERS-JURISPRUDENCES --------------------
  @Post('dossiers')
  @RequirePermissions('JURISPRUDENCE.ecriture')
  @ApiOperation({ summary: 'Associer une jurisprudence à un dossier' })
  @ApiResponse({
    status: 201,
    description: 'Association créée avec succès',
  })
  createDossierJurisprudence(
    @Body() createDossierJurisprudenceDto: CreateDossierJurisprudenceDto,
  ) {
    return this.jurisprudenceService.createDossierJurisprudence(
      createDossierJurisprudenceDto,
    );
  }

  @Get('dossiers')
  @RequirePermissions('JURISPRUDENCE.lecture')
  @ApiOperation({ summary: 'Récupérer les associations dossier-jurisprudence' })
  @ApiQuery({
    name: 'dossierId',
    required: false,
    description: 'ID du dossier',
  })
  @ApiQuery({
    name: 'jurisprudenceId',
    required: false,
    description: 'ID de la jurisprudence',
  })
  @ApiResponse({
    status: 200,
    description: 'Associations récupérées avec succès',
  })
  findAllDossiersJurisprudences(
    @Query('dossierId') dossierId?: string,
    @Query('jurisprudenceId') jurisprudenceId?: string,
  ) {
    return this.jurisprudenceService.findAllDossiersJurisprudences(
      dossierId,
      jurisprudenceId,
    );
  }

  @Get('dossiers/:id')
  @RequirePermissions('JURISPRUDENCE.lecture')
  @ApiOperation({
    summary: "Récupérer les détails d'une association dossier-jurisprudence",
  })
  @ApiParam({ name: 'id', description: "ID de l'association" })
  @ApiResponse({
    status: 200,
    description: "Détails de l'association récupérés avec succès",
  })
  @ApiResponse({
    status: 404,
    description: 'Association non trouvée',
  })
  findOneDossierJurisprudence(@Param('id', ParseUUIDPipe) id: string) {
    return this.jurisprudenceService.findOneDossierJurisprudence(id);
  }

  @Patch('dossiers/:id')
  @RequirePermissions('JURISPRUDENCE.ecriture')
  @ApiOperation({
    summary: 'Mettre à jour une association dossier-jurisprudence',
  })
  @ApiParam({ name: 'id', description: "ID de l'association" })
  @ApiResponse({
    status: 200,
    description: 'Association mise à jour avec succès',
  })
  @ApiResponse({
    status: 404,
    description: 'Association non trouvée',
  })
  updateDossierJurisprudence(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDossierJurisprudenceDto: UpdateDossierJurisprudenceDto,
  ) {
    return this.jurisprudenceService.updateDossierJurisprudence(
      id,
      updateDossierJurisprudenceDto,
    );
  }

  @Delete('dossiers/:id')
  @RequirePermissions('JURISPRUDENCE.suppression')
  @ApiOperation({ summary: 'Supprimer une association dossier-jurisprudence' })
  @ApiParam({ name: 'id', description: "ID de l'association" })
  @ApiResponse({
    status: 200,
    description: 'Association supprimée avec succès',
  })
  @ApiResponse({
    status: 404,
    description: 'Association non trouvée',
  })
  removeDossierJurisprudence(@Param('id', ParseUUIDPipe) id: string) {
    return this.jurisprudenceService.removeDossierJurisprudence(id);
  }

  // -------------------- RECHERCHE ET RECOMMANDATIONS --------------------
  @Get('search/:query')
  @RequirePermissions('JURISPRUDENCE.lecture')
  @ApiOperation({ summary: 'Rechercher des jurisprudences' })
  @ApiParam({ name: 'query', description: 'Terme de recherche' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Nombre maximum de résultats',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Résultats de recherche récupérés avec succès',
  })
  searchJurisprudences(
    @Param('query') query: string,
    @Query('limit') limit?: number,
  ) {
    return this.jurisprudenceService.searchJurisprudences(query, limit);
  }

  @Get(':id/similaires')
  @RequirePermissions('JURISPRUDENCE.lecture')
  @ApiOperation({ summary: 'Récupérer des jurisprudences similaires' })
  @ApiParam({ name: 'id', description: 'ID de la jurisprudence de référence' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Nombre maximum de résultats',
    example: 5,
  })
  @ApiResponse({
    status: 200,
    description: 'Jurisprudences similaires récupérées avec succès',
  })
  @ApiResponse({
    status: 404,
    description: 'Jurisprudence non trouvée',
  })
  getJurisprudencesSimilaires(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('limit') limit?: number,
  ) {
    return this.jurisprudenceService.getJurisprudencesSimilaires(id, limit);
  }

  @Get('dossiers/:dossierId/recommandees')
  @RequirePermissions('JURISPRUDENCE.lecture')
  @ApiOperation({
    summary: 'Récupérer des jurisprudences recommandées pour un dossier',
  })
  @ApiParam({ name: 'dossierId', description: 'ID du dossier' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Nombre maximum de résultats',
    example: 5,
  })
  @ApiResponse({
    status: 200,
    description: 'Jurisprudences recommandées récupérées avec succès',
  })
  @ApiResponse({
    status: 404,
    description: 'Dossier non trouvé',
  })
  getJurisprudencesRecommandees(
    @Param('dossierId', ParseUUIDPipe) dossierId: string,
    @Query('limit') limit?: number,
  ) {
    return this.jurisprudenceService.getJurisprudencesRecommandees(
      dossierId,
      limit,
    );
  }

  // -------------------- STATISTIQUES --------------------
  @Get('stats')
  @RequirePermissions('JURISPRUDENCE.lecture')
  @ApiOperation({ summary: 'Récupérer les statistiques des jurisprudences' })
  @ApiResponse({
    status: 200,
    description: 'Statistiques récupérées avec succès',
  })
  getStats() {
    return this.jurisprudenceService.getStats();
  }

  // -------------------- ENDPOINTS SPÉCIFIQUES --------------------
  @Get('dossier/:dossierId')
  @RequirePermissions('JURISPRUDENCE.lecture')
  @ApiOperation({ summary: "Récupérer les jurisprudences d'un dossier" })
  @ApiParam({ name: 'dossierId', description: 'ID du dossier' })
  @ApiResponse({
    status: 200,
    description: 'Jurisprudences du dossier récupérées avec succès',
  })
  getJurisprudencesByDossier(
    @Param('dossierId', ParseUUIDPipe) dossierId: string,
    @Query() query: QueryJurisprudenceDto,
  ) {
    return this.jurisprudenceService.findAllJurisprudences({
      ...query,
      dossierId,
    });
  }
}
