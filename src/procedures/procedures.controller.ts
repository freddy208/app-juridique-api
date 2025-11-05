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
import { ProceduresService } from './procedures.service';
import { CreateProcedureDto } from './dto/create-procedure.dto';
import { UpdateProcedureDto } from './dto/update-procedure.dto';
import { CreateEtapeProcedureDto } from './dto/create-etape-procedure.dto';
import { UpdateEtapeProcedureDto } from './dto/update-etape-procedure.dto';
import { CreateAudienceDto } from './dto/create-audience.dto';
import { UpdateAudienceDto } from './dto/update-audience.dto';
import { CreatePieceJustificativeDto } from './dto/create-piece-justificative.dto';
import { UpdatePieceJustificativeDto } from './dto/update-piece-justificative.dto';
import { QueryProceduresDto } from './dto/query-procedures.dto';
import { QueryAudiencesDto } from './dto/query-audiences.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { RequirePermissions } from '../permissions/decorators/permissions.decorator';
import { ParseUUIDPipe } from '../common/pipes/parse-uuid.pipe';

@ApiTags('Procédures Judiciaires')
@Controller('procedures')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ProceduresController {
  constructor(private readonly proceduresService: ProceduresService) {}

  // -------------------- GESTION DES PROCÉDURES --------------------
  @Post()
  @RequirePermissions('PROCEDURES.ecriture')
  @ApiOperation({ summary: 'Créer une nouvelle procédure' })
  @ApiResponse({ status: 201, description: 'Procédure créée avec succès' })
  createProcedure(@Body() createProcedureDto: CreateProcedureDto) {
    return this.proceduresService.createProcedure(createProcedureDto);
  }

  @Get()
  @RequirePermissions('PROCEDURES.lecture')
  @ApiOperation({ summary: 'Récupérer la liste des procédures' })
  @ApiResponse({
    status: 200,
    description: 'Liste des procédures récupérée avec succès',
  })
  findAllProcedures(@Query() query: QueryProceduresDto) {
    return this.proceduresService.findAllProcedures(query);
  }

  @Get(':id')
  @RequirePermissions('PROCEDURES.lecture')
  @ApiOperation({ summary: "Récupérer les détails d'une procédure" })
  @ApiParam({ name: 'id', description: 'ID de la procédure' })
  @ApiResponse({
    status: 200,
    description: 'Détails de la procédure récupérés avec succès',
  })
  @ApiResponse({
    status: 404,
    description: 'Procédure non trouvée',
  })
  findOneProcedure(@Param('id', ParseUUIDPipe) id: string) {
    return this.proceduresService.findOneProcedure(id);
  }

  @Patch(':id')
  @RequirePermissions('PROCEDURES.ecriture')
  @ApiOperation({ summary: 'Mettre à jour une procédure' })
  @ApiParam({ name: 'id', description: 'ID de la procédure' })
  @ApiResponse({
    status: 200,
    description: 'Procédure mise à jour avec succès',
  })
  @ApiResponse({
    status: 404,
    description: 'Procédure non trouvée',
  })
  updateProcedure(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProcedureDto: UpdateProcedureDto,
  ) {
    return this.proceduresService.updateProcedure(id, updateProcedureDto);
  }

  @Delete(':id')
  @RequirePermissions('PROCEDURES.suppression')
  @ApiOperation({ summary: 'Supprimer une procédure' })
  @ApiParam({ name: 'id', description: 'ID de la procédure' })
  @ApiResponse({
    status: 200,
    description: 'Procédure supprimée avec succès',
  })
  @ApiResponse({
    status: 404,
    description: 'Procédure non trouvée',
  })
  removeProcedure(@Param('id', ParseUUIDPipe) id: string) {
    return this.proceduresService.removeProcedure(id);
  }

  // -------------------- GESTION DES ÉTAPES DE PROCÉDURE --------------------
  @Post('etapes')
  @RequirePermissions('PROCEDURES.ecriture')
  @ApiOperation({ summary: 'Créer une nouvelle étape de procédure' })
  @ApiResponse({
    status: 201,
    description: 'Étape de procédure créée avec succès',
  })
  createEtapeProcedure(
    @Body() createEtapeProcedureDto: CreateEtapeProcedureDto,
  ) {
    return this.proceduresService.createEtapeProcedure(createEtapeProcedureDto);
  }

  @Get('etapes')
  @RequirePermissions('PROCEDURES.lecture')
  @ApiOperation({ summary: 'Récupérer la liste des étapes de procédure' })
  @ApiQuery({
    name: 'procedureId',
    required: false,
    description: 'ID de la procédure',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des étapes de procédure récupérée avec succès',
  })
  findAllEtapesProcedure(@Query('procedureId') procedureId?: string) {
    return this.proceduresService.findAllEtapesProcedure(procedureId);
  }

  @Get('etapes/:id')
  @RequirePermissions('PROCEDURES.lecture')
  @ApiOperation({ summary: "Récupérer les détails d'une étape de procédure" })
  @ApiParam({ name: 'id', description: "ID de l'étape de procédure" })
  @ApiResponse({
    status: 200,
    description: "Détails de l'étape de procédure récupérés avec succès",
  })
  @ApiResponse({
    status: 404,
    description: 'Étape de procédure non trouvée',
  })
  findOneEtapeProcedure(@Param('id', ParseUUIDPipe) id: string) {
    return this.proceduresService.findOneEtapeProcedure(id);
  }

  @Patch('etapes/:id')
  @RequirePermissions('PROCEDURES.ecriture')
  @ApiOperation({ summary: 'Mettre à jour une étape de procédure' })
  @ApiParam({ name: 'id', description: "ID de l'étape de procédure" })
  @ApiResponse({
    status: 200,
    description: 'Étape de procédure mise à jour avec succès',
  })
  @ApiResponse({
    status: 404,
    description: 'Étape de procédure non trouvée',
  })
  updateEtapeProcedure(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateEtapeProcedureDto: UpdateEtapeProcedureDto,
  ) {
    return this.proceduresService.updateEtapeProcedure(
      id,
      updateEtapeProcedureDto,
    );
  }

  @Delete('etapes/:id')
  @RequirePermissions('PROCEDURES.suppression')
  @ApiOperation({ summary: 'Supprimer une étape de procédure' })
  @ApiParam({ name: 'id', description: "ID de l'étape de procédure" })
  @ApiResponse({
    status: 200,
    description: 'Étape de procédure supprimée avec succès',
  })
  @ApiResponse({
    status: 404,
    description: 'Étape de procédure non trouvée',
  })
  removeEtapeProcedure(@Param('id', ParseUUIDPipe) id: string) {
    return this.proceduresService.removeEtapeProcedure(id);
  }

  // -------------------- GESTION DES AUDIENCES --------------------
  @Post('audiences')
  @RequirePermissions('PROCEDURES.ecriture')
  @ApiOperation({ summary: 'Créer une nouvelle audience' })
  @ApiResponse({ status: 201, description: 'Audience créée avec succès' })
  createAudience(@Body() createAudienceDto: CreateAudienceDto) {
    return this.proceduresService.createAudience(createAudienceDto);
  }

  @Get('audiences')
  @RequirePermissions('PROCEDURES.lecture')
  @ApiOperation({ summary: 'Récupérer la liste des audiences' })
  @ApiResponse({
    status: 200,
    description: 'Liste des audiences récupérée avec succès',
  })
  findAllAudiences(@Query() query: QueryAudiencesDto) {
    return this.proceduresService.findAllAudiences(query);
  }

  @Get('audiences/:id')
  @RequirePermissions('PROCEDURES.lecture')
  @ApiOperation({ summary: "Récupérer les détails d'une audience" })
  @ApiParam({ name: 'id', description: "ID de l'audience" })
  @ApiResponse({
    status: 200,
    description: "Détails de l'audience récupérés avec succès",
  })
  @ApiResponse({
    status: 404,
    description: 'Audience non trouvée',
  })
  findOneAudience(@Param('id', ParseUUIDPipe) id: string) {
    return this.proceduresService.findOneAudience(id);
  }

  @Patch('audiences/:id')
  @RequirePermissions('PROCEDURES.ecriture')
  @ApiOperation({ summary: 'Mettre à jour une audience' })
  @ApiParam({ name: 'id', description: "ID de l'audience" })
  @ApiResponse({
    status: 200,
    description: 'Audience mise à jour avec succès',
  })
  @ApiResponse({
    status: 404,
    description: 'Audience non trouvée',
  })
  updateAudience(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateAudienceDto: UpdateAudienceDto,
  ) {
    return this.proceduresService.updateAudience(id, updateAudienceDto);
  }

  @Delete('audiences/:id')
  @RequirePermissions('PROCEDURES.suppression')
  @ApiOperation({ summary: 'Supprimer une audience' })
  @ApiParam({ name: 'id', description: "ID de l'audience" })
  @ApiResponse({
    status: 200,
    description: 'Audience supprimée avec succès',
  })
  @ApiResponse({
    status: 404,
    description: 'Audience non trouvée',
  })
  removeAudience(@Param('id', ParseUUIDPipe) id: string) {
    return this.proceduresService.removeAudience(id);
  }

  // -------------------- GESTION DES PIÈCES JUSTIFICATIVES --------------------
  @Post('pieces')
  @RequirePermissions('PROCEDURES.ecriture')
  @ApiOperation({ summary: 'Créer une nouvelle pièce justificative' })
  @ApiResponse({
    status: 201,
    description: 'Pièce justificative créée avec succès',
  })
  createPieceJustificative(
    @Body() createPieceJustificativeDto: CreatePieceJustificativeDto,
  ) {
    return this.proceduresService.createPieceJustificative(
      createPieceJustificativeDto,
    );
  }

  @Get('pieces')
  @RequirePermissions('PROCEDURES.lecture')
  @ApiOperation({ summary: 'Récupérer la liste des pièces justificatives' })
  @ApiQuery({
    name: 'procedureId',
    required: false,
    description: 'ID de la procédure',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des pièces justificatives récupérée avec succès',
  })
  findAllPiecesJustificatives(@Query('procedureId') procedureId?: string) {
    return this.proceduresService.findAllPiecesJustificatives(procedureId);
  }

  @Get('pieces/:id')
  @RequirePermissions('PROCEDURES.lecture')
  @ApiOperation({ summary: "Récupérer les détails d'une pièce justificative" })
  @ApiParam({ name: 'id', description: 'ID de la pièce justificative' })
  @ApiResponse({
    status: 200,
    description: 'Détails de la pièce justificative récupérés avec succès',
  })
  @ApiResponse({
    status: 404,
    description: 'Pièce justificative non trouvée',
  })
  findOnePieceJustificative(@Param('id', ParseUUIDPipe) id: string) {
    return this.proceduresService.findOnePieceJustificative(id);
  }

  @Patch('pieces/:id')
  @RequirePermissions('PROCEDURES.ecriture')
  @ApiOperation({ summary: 'Mettre à jour une pièce justificative' })
  @ApiParam({ name: 'id', description: 'ID de la pièce justificative' })
  @ApiResponse({
    status: 200,
    description: 'Pièce justificative mise à jour avec succès',
  })
  @ApiResponse({
    status: 404,
    description: 'Pièce justificative non trouvée',
  })
  updatePieceJustificative(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePieceJustificativeDto: UpdatePieceJustificativeDto,
  ) {
    return this.proceduresService.updatePieceJustificative(
      id,
      updatePieceJustificativeDto,
    );
  }

  @Delete('pieces/:id')
  @RequirePermissions('PROCEDURES.suppression')
  @ApiOperation({ summary: 'Supprimer une pièce justificative' })
  @ApiParam({ name: 'id', description: 'ID de la pièce justificative' })
  @ApiResponse({
    status: 200,
    description: 'Pièce justificative supprimée avec succès',
  })
  @ApiResponse({
    status: 404,
    description: 'Pièce justificative non trouvée',
  })
  removePieceJustificative(@Param('id', ParseUUIDPipe) id: string) {
    return this.proceduresService.removePieceJustificative(id);
  }

  // -------------------- CALCUL DES DÉLAIS ET ALERTES --------------------
  @Get(':id/delais')
  @RequirePermissions('PROCEDURES.lecture')
  @ApiOperation({ summary: "Calculer les délais d'une procédure" })
  @ApiParam({ name: 'id', description: 'ID de la procédure' })
  @ApiResponse({
    status: 200,
    description: 'Délais calculés avec succès',
  })
  @ApiResponse({
    status: 404,
    description: 'Procédure non trouvée',
  })
  calculateDelaisProcedure(@Param('id', ParseUUIDPipe) id: string) {
    return this.proceduresService.calculateDelaisProcedure(id);
  }

  @Get('echeances/proches')
  @RequirePermissions('PROCEDURES.lecture')
  @ApiOperation({ summary: 'Récupérer les échéances proches' })
  @ApiQuery({
    name: 'jours',
    required: false,
    description: 'Nombre de jours à considérer',
    example: 7,
  })
  @ApiResponse({
    status: 200,
    description: 'Échéances proches récupérées avec succès',
  })
  getEcheancesProches(@Query('jours') jours?: number) {
    return this.proceduresService.getEcheancesProches(jours);
  }

  @Get('audiences/proches')
  @RequirePermissions('PROCEDURES.lecture')
  @ApiOperation({ summary: 'Récupérer les audiences proches' })
  @ApiQuery({
    name: 'jours',
    required: false,
    description: 'Nombre de jours à considérer',
    example: 7,
  })
  @ApiResponse({
    status: 200,
    description: 'Audiences proches récupérées avec succès',
  })
  getAudiencesProches(@Query('jours') jours?: number) {
    return this.proceduresService.getAudiencesProches(jours);
  }

  // -------------------- STATISTIQUES --------------------
  @Get('stats')
  @RequirePermissions('PROCEDURES.lecture')
  @ApiOperation({ summary: 'Récupérer les statistiques des procédures' })
  @ApiResponse({
    status: 200,
    description: 'Statistiques récupérées avec succès',
  })
  getStats() {
    return this.proceduresService.getStats();
  }

  // -------------------- ENDPOINTS SPÉCIFIQUES --------------------
  @Get('dossier/:dossierId')
  @RequirePermissions('PROCEDURES.lecture')
  @ApiOperation({ summary: "Récupérer les procédures d'un dossier" })
  @ApiParam({ name: 'dossierId', description: 'ID du dossier' })
  @ApiResponse({
    status: 200,
    description: 'Procédures du dossier récupérées avec succès',
  })
  getProceduresByDossier(
    @Param('dossierId', ParseUUIDPipe) dossierId: string,
    @Query() query: QueryProceduresDto,
  ) {
    return this.proceduresService.findAllProcedures({ ...query, dossierId });
  }

  @Get('procedure/:procedureId/etapes')
  @RequirePermissions('PROCEDURES.lecture')
  @ApiOperation({ summary: "Récupérer les étapes d'une procédure" })
  @ApiParam({ name: 'procedureId', description: 'ID de la procédure' })
  @ApiResponse({
    status: 200,
    description: 'Étapes de la procédure récupérées avec succès',
  })
  getEtapesByProcedure(
    @Param('procedureId', ParseUUIDPipe) procedureId: string,
  ) {
    return this.proceduresService.findAllEtapesProcedure(procedureId);
  }

  @Get('procedure/:procedureId/audiences')
  @RequirePermissions('PROCEDURES.lecture')
  @ApiOperation({ summary: "Récupérer les audiences d'une procédure" })
  @ApiParam({ name: 'procedureId', description: 'ID de la procédure' })
  @ApiResponse({
    status: 200,
    description: 'Audiences de la procédure récupérées avec succès',
  })
  getAudiencesByProcedure(
    @Param('procedureId', ParseUUIDPipe) procedureId: string,
    @Query() query: QueryAudiencesDto,
  ) {
    return this.proceduresService.findAllAudiences({ ...query, procedureId });
  }

  @Get('procedure/:procedureId/pieces')
  @RequirePermissions('PROCEDURES.lecture')
  @ApiOperation({
    summary: "Récupérer les pièces justificatives d'une procédure",
  })
  @ApiParam({ name: 'procedureId', description: 'ID de la procédure' })
  @ApiResponse({
    status: 200,
    description: 'Pièces justificatives de la procédure récupérées avec succès',
  })
  getPiecesByProcedure(
    @Param('procedureId', ParseUUIDPipe) procedureId: string,
  ) {
    return this.proceduresService.findAllPiecesJustificatives(procedureId);
  }
}
