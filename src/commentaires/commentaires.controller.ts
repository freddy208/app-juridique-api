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
import { CommentairesService } from './commentaires.service';
import { CreateCommentaireDto } from './dto/create-commentaire.dto';
import { UpdateCommentaireDto } from './dto/update-commentaire.dto';
import { QueryCommentairesDto } from './dto/query-commentaires.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { RequirePermissions } from '../permissions/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ParseUUIDPipe } from '../common/pipes/parse-uuid.pipe';

@ApiTags('Commentaires')
@Controller('commentaires')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class CommentairesController {
  constructor(private readonly commentairesService: CommentairesService) {}

  @Post()
  @RequirePermissions('COMMENTAIRES.ecriture')
  @ApiOperation({ summary: 'Créer un nouveau commentaire' })
  @ApiResponse({ status: 201, description: 'Commentaire créé avec succès' })
  @ApiResponse({
    status: 400,
    description: 'Un commentaire doit être associé à un document ou une tâche',
  })
  @ApiResponse({
    status: 404,
    description: 'Document ou tâche non trouvé',
  })
  create(
    @Body() createCommentaireDto: CreateCommentaireDto,
    @CurrentUser('id') utilisateurId: string,
  ) {
    return this.commentairesService.create(createCommentaireDto, utilisateurId);
  }

  @Get()
  @RequirePermissions('COMMENTAIRES.lecture')
  @ApiOperation({ summary: 'Récupérer la liste des commentaires' })
  @ApiResponse({
    status: 200,
    description: 'Liste des commentaires récupérée avec succès',
  })
  findAll(@Query() query: QueryCommentairesDto) {
    return this.commentairesService.findAll(query);
  }

  @Get('search')
  @RequirePermissions('COMMENTAIRES.lecture')
  @ApiOperation({ summary: 'Rechercher des commentaires' })
  @ApiQuery({ name: 'q', description: 'Terme de recherche', required: true })
  @ApiResponse({ status: 200, description: 'Résultats de la recherche' })
  searchCommentaires(
    @Query('q') searchTerm: string,
    @Query() query: QueryCommentairesDto,
  ) {
    return this.commentairesService.searchCommentaires(searchTerm, query);
  }

  @Get('stats')
  @RequirePermissions('COMMENTAIRES.lecture')
  @ApiOperation({ summary: 'Récupérer les statistiques des commentaires' })
  @ApiResponse({
    status: 200,
    description: 'Statistiques récupérées avec succès',
  })
  getStats(@CurrentUser('id') utilisateurId?: string) {
    return this.commentairesService.getStats(utilisateurId);
  }

  @Get(':id')
  @RequirePermissions('COMMENTAIRES.lecture')
  @ApiOperation({ summary: "Récupérer les détails d'un commentaire" })
  @ApiParam({ name: 'id', description: 'ID du commentaire' })
  @ApiResponse({
    status: 200,
    description: 'Détails du commentaire récupérés avec succès',
  })
  @ApiResponse({
    status: 404,
    description: 'Commentaire non trouvé',
  })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.commentairesService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions('COMMENTAIRES.ecriture')
  @ApiOperation({ summary: 'Mettre à jour un commentaire' })
  @ApiParam({ name: 'id', description: 'ID du commentaire' })
  @ApiResponse({
    status: 200,
    description: 'Commentaire mis à jour avec succès',
  })
  @ApiResponse({
    status: 404,
    description: 'Commentaire non trouvé',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCommentaireDto: UpdateCommentaireDto,
  ) {
    return this.commentairesService.update(id, updateCommentaireDto);
  }

  @Delete(':id')
  @RequirePermissions('COMMENTAIRES.suppression')
  @ApiOperation({ summary: 'Supprimer un commentaire' })
  @ApiParam({ name: 'id', description: 'ID du commentaire' })
  @ApiResponse({
    status: 200,
    description: 'Commentaire supprimé avec succès',
  })
  @ApiResponse({
    status: 404,
    description: 'Commentaire non trouvé',
  })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.commentairesService.remove(id);
  }

  // -------------------- ENDPOINTS SPÉCIFIQUES --------------------
  @Get('document/:documentId')
  @RequirePermissions('COMMENTAIRES.lecture')
  @ApiOperation({ summary: "Récupérer les commentaires d'un document" })
  @ApiParam({ name: 'documentId', description: 'ID du document' })
  @ApiResponse({
    status: 200,
    description: 'Commentaires du document récupérés avec succès',
  })
  @ApiResponse({
    status: 404,
    description: 'Document non trouvé',
  })
  getCommentairesByDocument(
    @Param('documentId', ParseUUIDPipe) documentId: string,
    @Query() query: QueryCommentairesDto,
  ) {
    return this.commentairesService.getCommentairesByDocument(
      documentId,
      query,
    );
  }

  @Get('tache/:tacheId')
  @RequirePermissions('COMMENTAIRES.lecture')
  @ApiOperation({ summary: "Récupérer les commentaires d'une tâche" })
  @ApiParam({ name: 'tacheId', description: 'ID de la tâche' })
  @ApiResponse({
    status: 200,
    description: 'Commentaires de la tâche récupérés avec succès',
  })
  @ApiResponse({
    status: 404,
    description: 'Tâche non trouvée',
  })
  getCommentairesByTache(
    @Param('tacheId', ParseUUIDPipe) tacheId: string,
    @Query() query: QueryCommentairesDto,
  ) {
    return this.commentairesService.getCommentairesByTache(tacheId, query);
  }

  @Get('utilisateur/:utilisateurId')
  @RequirePermissions('COMMENTAIRES.lecture')
  @ApiOperation({ summary: "Récupérer les commentaires d'un utilisateur" })
  @ApiParam({ name: 'utilisateurId', description: "ID de l'utilisateur" })
  @ApiResponse({
    status: 200,
    description: "Commentaires de l'utilisateur récupérés avec succès",
  })
  @ApiResponse({
    status: 404,
    description: 'Utilisateur non trouvé',
  })
  getCommentairesByUtilisateur(
    @Param('utilisateurId', ParseUUIDPipe) utilisateurId: string,
    @Query() query: QueryCommentairesDto,
  ) {
    return this.commentairesService.getCommentairesByUtilisateur(
      utilisateurId,
      query,
    );
  }

  // -------------------- ENDPOINTS POUR L'UTILISATEUR CONNECTÉ --------------------
  @Get('profile/me')
  @ApiOperation({
    summary: "Récupérer les commentaires de l'utilisateur connecté",
  })
  @ApiResponse({
    status: 200,
    description: 'Commentaires récupérés avec succès',
  })
  getMyCommentaires(
    @Query() query: QueryCommentairesDto,
    @CurrentUser('id') utilisateurId: string,
  ) {
    return this.commentairesService.getCommentairesByUtilisateur(
      utilisateurId,
      query,
    );
  }

  @Get('profile/me/stats')
  @ApiOperation({
    summary:
      "Récupérer les statistiques de commentaires de l'utilisateur connecté",
  })
  @ApiResponse({
    status: 200,
    description: 'Statistiques récupérées avec succès',
  })
  getMyStats(@CurrentUser('id') utilisateurId: string) {
    return this.commentairesService.getStats(utilisateurId);
  }
}
