import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Body,
  Req,
  Post,
  Put,
  Patch,
  Delete,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
  ApiOkResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DocumentsService } from './documents.service';
import { FilterDocumentDto } from './dto/filter-document.dto';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { User } from '../auth/decorators/user.decorator';
import { UpdateDocumentStatusDto } from './dto/update-document-status.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@ApiTags('documents')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get()
  @ApiOperation({ summary: 'Liste des documents avec filtres avancés' })
  async findAll(@Query() filters: FilterDocumentDto) {
    return this.documentsService.findAll(filters);
  }
  @Get(':id')
  @ApiOperation({ summary: 'Détails d’un document par son ID' })
  @ApiNotFoundResponse({ description: 'Document non trouvé ou supprimé' })
  async findOne(@Param('id') id: string) {
    return this.documentsService.findOne(id);
  }
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Upload de document',
    schema: {
      type: 'object',
      properties: {
        dossierId: { type: 'string' },
        titre: { type: 'string' },
        type: { type: 'string' },
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiCreatedResponse({ description: 'Document téléversé avec succès' })
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadDocumentDto,
    @Req() req: any,
  ) {
    // ⚠️ Ici on suppose que l'utilisateur est extrait du token JWT
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const utilisateurId = req.user?.id || 'uuid-temporaire';
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return this.documentsService.upload(file, dto, utilisateurId);
  }
  @Put(':id')
  @ApiOperation({
    summary: 'Modifier les métadonnées d’un document (titre, type, dossier)',
  })
  @ApiOkResponse({ description: 'Document mis à jour' })
  @ApiNotFoundResponse({ description: 'Document ou dossier introuvable' })
  @ApiBadRequestResponse({
    description: 'Requête invalide (ex: dossier supprimé, document supprimé)',
  })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateDocumentDto,
    @User() user: { id: string },
  ) {
    const utilisateurId = user?.id;
    return this.documentsService.updateMetadata(id, dto, utilisateurId);
  }
  @Patch(':id/status')
  @ApiOperation({
    summary: 'Changer le statut d’un document (Activer, Archiver, Supprimer)',
  })
  @ApiOkResponse({ description: 'Statut du document mis à jour' })
  @ApiNotFoundResponse({ description: 'Document introuvable ou supprimé' })
  @ApiBadRequestResponse({
    description: 'Requête invalide (déjà supprimé ou statut identique)',
  })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateDocumentStatusDto,
    @User() user: { id: string },
  ) {
    return this.documentsService.updateStatus(id, dto, user.id);
  }
  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un document (soft delete)' })
  @ApiOkResponse({ description: 'Document supprimé avec succès' })
  @ApiNotFoundResponse({ description: 'Document introuvable' })
  @ApiBadRequestResponse({ description: 'Document déjà supprimé' })
  async softDelete(@Param('id') id: string, @User() user: { id: string }) {
    return this.documentsService.softDelete(id, user.id);
  }
  @Get(':id/versions')
  @ApiOperation({ summary: 'Historique des versions d’un document' })
  @ApiOkResponse({
    description: 'Liste des versions du document',
    schema: {
      type: 'object',
      properties: {
        totalVersions: { type: 'number' },
        documentId: { type: 'string' },
        versions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              titre: { type: 'string' },
              type: { type: 'string' },
              url: { type: 'string' },
              version: { type: 'number' },
              statut: { type: 'string' },
              creeLe: { type: 'string', format: 'date-time' },
              modifieLe: { type: 'string', format: 'date-time' },
              utilisateur: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  prenom: { type: 'string' },
                  nom: { type: 'string' },
                  email: { type: 'string' },
                },
              },
              dossier: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  numeroUnique: { type: 'string' },
                  titre: { type: 'string' },
                  type: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Document introuvable ou pas de versions',
  })
  async getVersions(@Param('id') id: string) {
    return this.documentsService.getDocumentVersions(id);
  }
  // src/documents/documents.controller.ts
  @Post(':id/versions')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Ajouter une nouvelle version d’un document existant',
  })
  @ApiBody({
    description: 'Téléversement de nouvelle version',
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
      required: ['file'],
    },
  })
  @ApiCreatedResponse({
    description: 'Nouvelle version créée avec succès',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        titre: { type: 'string' },
        type: { type: 'string' },
        url: { type: 'string' },
        version: { type: 'number' },
        statut: { type: 'string' },
        creeLe: { type: 'string', format: 'date-time' },
        modifieLe: { type: 'string', format: 'date-time' },
        utilisateur: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            prenom: { type: 'string' },
            nom: { type: 'string' },
            email: { type: 'string' },
          },
        },
        dossier: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            numeroUnique: { type: 'string' },
            titre: { type: 'string' },
            type: { type: 'string' },
          },
        },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Document introuvable ou supprimé' })
  async addVersion(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @User() user: { id: string },
  ) {
    const utilisateurId = user?.id;
    return this.documentsService.addNewVersion(id, file, utilisateurId);
  }
  @Get(':id/comments')
  @ApiOperation({ summary: 'Lister les commentaires internes d’un document' })
  @ApiOkResponse({
    description: 'Liste des commentaires liés au document',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number' },
        documentId: { type: 'string' },
        comments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              contenu: { type: 'string' },
              creeLe: { type: 'string', format: 'date-time' },
              utilisateur: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  prenom: { type: 'string' },
                  nom: { type: 'string' },
                  email: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Document introuvable ou supprimé' })
  async getComments(@Param('id') id: string) {
    return this.documentsService.getCommentsForDocument(id);
  }
  @Post(':id/comments')
  @ApiOperation({ summary: 'Ajouter un commentaire à un document' })
  @ApiCreatedResponse({
    description: 'Commentaire ajouté avec succès',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        contenu: { type: 'string' },
        creeLe: { type: 'string', format: 'date-time' },
        utilisateur: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            prenom: { type: 'string' },
            nom: { type: 'string' },
            email: { type: 'string' },
          },
        },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Document introuvable ou supprimé' })
  @ApiBadRequestResponse({ description: 'Requête invalide' })
  async addComment(
    @Param('id') id: string,
    @Body() dto: CreateCommentDto,
    @User() user: { id: string },
  ) {
    const utilisateurId = user?.id;
    return this.documentsService.addCommentToDocument(id, dto, utilisateurId);
  }
  @Patch(':id/comments/:commentId')
  @ApiOperation({ summary: 'Modifier un commentaire d’un document' })
  @ApiOkResponse({
    description: 'Commentaire modifié avec succès',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        contenu: { type: 'string' },
        creeLe: { type: 'string', format: 'date-time' },
        modifieLe: { type: 'string', format: 'date-time' },
        utilisateur: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            prenom: { type: 'string' },
            nom: { type: 'string' },
            email: { type: 'string' },
          },
        },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Document ou commentaire introuvable' })
  @ApiBadRequestResponse({ description: 'Requête invalide' })
  async updateComment(
    @Param('id') id: string,
    @Param('commentId') commentId: string,
    @Body() dto: UpdateCommentDto,
    @User() user: { id: string },
  ) {
    return this.documentsService.updateComment(id, commentId, dto, user.id);
  }
  @Delete(':id/comments/:commentId')
  @ApiOperation({ summary: 'Supprimer un commentaire (soft delete)' })
  @ApiOkResponse({ description: 'Commentaire supprimé avec succès' })
  @ApiNotFoundResponse({ description: 'Document ou commentaire introuvable' })
  @ApiBadRequestResponse({ description: 'Requête invalide' })
  async softDeleteComment(
    @Param('id') id: string,
    @Param('commentId') commentId: string,
    @User() user: { id: string },
  ) {
    return this.documentsService.softDeleteComment(id, commentId, user.id);
  }
  @Get('/server-time')
  getServerTime() {
    return { serverTime: new Date().toISOString() };
  }
}
