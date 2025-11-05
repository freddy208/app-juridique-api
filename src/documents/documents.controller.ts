/* eslint-disable @typescript-eslint/no-unsafe-argument */
// documents.controller.ts
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
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiConsumes,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { QueryDocumentDto } from './dto/query-document.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { RequirePermissions } from '../permissions/decorators/permissions.decorator';
import { diskStorage } from 'multer';
import { extname } from 'path';

@ApiTags('Documents')
@Controller('documents')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  @RequirePermissions('DOCUMENTS.ecriture')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        const allowedMimes = [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'image/jpeg',
          'image/png',
          'image/jpg',
        ];
        if (allowedMimes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Type de fichier non supporté'), false);
        }
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Téléverser un nouveau document' })
  @ApiResponse({ status: 201, description: 'Document téléversé avec succès.' })
  create(
    @Body() createDocumentDto: CreateDocumentDto,
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
  ) {
    if (!file) {
      throw new BadRequestException('Veuillez fournir un fichier');
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return this.documentsService.create(createDocumentDto, file, req.user.id);
  }

  @Get()
  @RequirePermissions('DOCUMENTS.lecture')
  @ApiOperation({ summary: 'Lister tous les documents' })
  @ApiResponse({ status: 200, description: 'Liste des documents récupérée.' })
  findAll(@Query() query: QueryDocumentDto) {
    return this.documentsService.findAll(query);
  }

  @Get('stats')
  @RequirePermissions('DOCUMENTS.lecture')
  @ApiOperation({ summary: 'Obtenir les statistiques des documents' })
  @ApiResponse({
    status: 200,
    description: 'Statistiques des documents récupérées.',
  })
  getStats() {
    return this.documentsService.getStats();
  }

  @Get('search')
  @RequirePermissions('DOCUMENTS.lecture')
  @ApiOperation({ summary: 'Rechercher des documents par contenu OCR' })
  @ApiResponse({
    status: 200,
    description: 'Résultats de la recherche OCR.',
  })
  searchByOCR(
    @Query('query') query: string,
    @Query('dossierId') dossierId?: string,
  ) {
    return this.documentsService.searchByOCR(query, dossierId);
  }

  @Get(':id')
  @RequirePermissions('DOCUMENTS.lecture')
  @ApiOperation({ summary: 'Récupérer un document par son ID' })
  @ApiParam({ name: 'id', description: 'ID du document' })
  @ApiResponse({ status: 200, description: 'Détails du document récupérés.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.documentsService.findOne(id);
  }

  @Get(':id/versions')
  @RequirePermissions('DOCUMENTS.lecture')
  @ApiOperation({ summary: "Récupérer toutes les versions d'un document" })
  @ApiParam({ name: 'id', description: 'ID du document' })
  @ApiResponse({ status: 200, description: 'Versions du document récupérées.' })
  getVersions(@Param('id', ParseUUIDPipe) id: string) {
    return this.documentsService.getVersions(id);
  }

  @Patch(':id')
  @RequirePermissions('DOCUMENTS.ecriture')
  @ApiOperation({ summary: 'Mettre à jour un document' })
  @ApiParam({ name: 'id', description: 'ID du document' })
  @ApiResponse({ status: 200, description: 'Document mis à jour.' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDocumentDto: UpdateDocumentDto,
  ) {
    return this.documentsService.update(id, updateDocumentDto);
  }

  @Delete(':id')
  @RequirePermissions('DOCUMENTS.suppression')
  @ApiOperation({ summary: 'Supprimer un document' })
  @ApiParam({ name: 'id', description: 'ID du document' })
  @ApiResponse({ status: 200, description: 'Document supprimé.' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.documentsService.remove(id);
  }
}
