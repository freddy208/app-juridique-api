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
import { CorrespondanceService } from './correspondances.service';
import { CreateCorrespondanceDto } from './dto/create-correspondance.dto';
import { UpdateCorrespondanceDto } from './dto/update-correspondance.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { RequirePermissions } from '../permissions/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { QueryCorrespondanceDto } from './dto/filter-correspondances.dto';

@ApiTags('Correspondances')
@Controller('correspondances')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class CorrespondanceController {
  constructor(private readonly correspondanceService: CorrespondanceService) {}

  @Post()
  @RequirePermissions('CORRESPONDANCES.ecriture')
  @ApiOperation({ summary: 'Créer une nouvelle correspondance' })
  @ApiResponse({ status: 201, description: 'Correspondance créée avec succès' })
  @ApiResponse({
    status: 400,
    description: 'Une correspondance doit être associée à un client',
  })
  @ApiResponse({
    status: 404,
    description: 'Client non trouvé',
  })
  create(
    @Body() createCorrespondanceDto: CreateCorrespondanceDto,
    @CurrentUser('id') utilisateurId: string,
  ) {
    return this.correspondanceService.create(
      createCorrespondanceDto,
      utilisateurId,
    );
  }

  @Get()
  @RequirePermissions('CORRESPONDANCES.lecture')
  @ApiOperation({ summary: 'Récupérer la liste des correspondances' })
  @ApiResponse({
    status: 200,
    description: 'Liste des correspondances récupérée avec succès',
  })
  findAll(@Query() query: QueryCorrespondanceDto) {
    return this.correspondanceService.findAll(query);
  }

  @Get('search')
  @RequirePermissions('CORRESPONDANCES.lecture')
  @ApiOperation({ summary: 'Rechercher des correspondances' })
  @ApiQuery({ name: 'q', description: 'Terme de recherche', required: true })
  @ApiResponse({ status: 200, description: 'Résultats de la recherche' })
  searchCorrespondances(
    @Query('q') searchTerm: string,
    @Query() query: QueryCorrespondanceDto,
  ) {
    return this.correspondanceService.searchCorrespondances(searchTerm, query);
  }

  @Get('stats')
  @RequirePermissions('CORRESPONDANCES.lecture')
  @ApiOperation({ summary: 'Récupérer les statistiques des correspondances' })
  @ApiResponse({
    status: 200,
    description: 'Statistiques récupérées avec succès',
  })
  getStats(@CurrentUser('id') utilisateurId?: string) {
    return this.correspondanceService.getStats(utilisateurId);
  }

  @Get(':id')
  @RequirePermissions('CORRESPONDANCES.lecture')
  @ApiOperation({ summary: "Récupérer les détails d'une correspondance" })
  @ApiParam({ name: 'id', description: 'ID de la correspondance' })
  @ApiResponse({
    status: 200,
    description: 'Détails de la correspondance récupérés avec succès',
  })
  @ApiResponse({
    status: 404,
    description: 'Correspondance non trouvée',
  })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.correspondanceService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions('CORRESPONDANCES.ecriture')
  @ApiOperation({ summary: 'Mettre à jour une correspondance' })
  @ApiParam({ name: 'id', description: 'ID de la correspondance' })
  @ApiResponse({
    status: 200,
    description: 'Correspondance mise à jour avec succès',
  })
  @ApiResponse({
    status: 404,
    description: 'Correspondance non trouvée',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCorrespondanceDto: UpdateCorrespondanceDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.correspondanceService.update(
      id,
      updateCorrespondanceDto,
      userId,
    );
  }

  @Delete(':id')
  @RequirePermissions('CORRESPONDANCES.suppression')
  @ApiOperation({ summary: 'Supprimer une correspondance' })
  @ApiParam({ name: 'id', description: 'ID de la correspondance' })
  @ApiResponse({
    status: 200,
    description: 'Correspondance supprimée avec succès',
  })
  @ApiResponse({
    status: 404,
    description: 'Correspondance non trouvée',
  })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.correspondanceService.remove(id);
  }

  // -------------------- ENDPOINTS SPÉCIFIQUES --------------------
  @Get('client/:clientId')
  @RequirePermissions('CORRESPONDANCES.lecture')
  @ApiOperation({ summary: "Récupérer les correspondances d'un client" })
  @ApiParam({ name: 'clientId', description: 'ID du client' })
  @ApiResponse({
    status: 200,
    description: 'Correspondances du client récupérées avec succès',
  })
  @ApiResponse({
    status: 404,
    description: 'Client non trouvé',
  })
  getCorrespondancesByClient(
    @Param('clientId', ParseUUIDPipe) clientId: string,
    @Query() query: QueryCorrespondanceDto,
  ) {
    return this.correspondanceService.getCorrespondancesByClient(
      clientId,
      query,
    );
  }

  @Get('utilisateur/:utilisateurId')
  @RequirePermissions('CORRESPONDANCES.lecture')
  @ApiOperation({ summary: "Récupérer les correspondances d'un utilisateur" })
  @ApiParam({ name: 'utilisateurId', description: "ID de l'utilisateur" })
  @ApiResponse({
    status: 200,
    description: "Correspondances de l'utilisateur récupérées avec succès",
  })
  @ApiResponse({
    status: 404,
    description: 'Utilisateur non trouvé',
  })
  getCorrespondancesByUtilisateur(
    @Param('utilisateurId', ParseUUIDPipe) utilisateurId: string,
    @Query() query: QueryCorrespondanceDto,
  ) {
    return this.correspondanceService.getCorrespondancesByUtilisateur(
      utilisateurId,
      query,
    );
  }

  // -------------------- ENDPOINTS POUR L'UTILISATEUR CONNECTÉ --------------------
  @Get('profile/me')
  @ApiOperation({
    summary: "Récupérer les correspondances de l'utilisateur connecté",
  })
  @ApiResponse({
    status: 200,
    description: 'Correspondances récupérées avec succès',
  })
  getMyCorrespondances(
    @Query() query: QueryCorrespondanceDto,
    @CurrentUser('id') utilisateurId: string,
  ) {
    return this.correspondanceService.getCorrespondancesByUtilisateur(
      utilisateurId,
      query,
    );
  }

  @Get('profile/me/stats')
  @ApiOperation({
    summary:
      "Récupérer les statistiques de correspondances de l'utilisateur connecté",
  })
  @ApiResponse({
    status: 200,
    description: 'Statistiques récupérées avec succès',
  })
  getMyStats(@CurrentUser('id') utilisateurId: string) {
    return this.correspondanceService.getStats(utilisateurId);
  }
}
