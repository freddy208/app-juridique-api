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
import { ClientService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { QueryClientDto } from './dto/query-client.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { RequirePermissions } from '../permissions/decorators/permissions.decorator';

@ApiTags('Clients')
@Controller('clients')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  @Post()
  @RequirePermissions('CLIENTS.ecriture')
  @ApiOperation({ summary: 'Créer un nouveau client' })
  @ApiResponse({ status: 201, description: 'Client créé avec succès.' })
  create(@Body() createClientDto: CreateClientDto) {
    return this.clientService.create(createClientDto);
  }

  @Get()
  @RequirePermissions('CLIENTS.lecture')
  @ApiOperation({ summary: 'Lister tous les clients' })
  @ApiResponse({ status: 200, description: 'Liste des clients récupérée.' })
  findAll(@Query() query: QueryClientDto) {
    return this.clientService.findAll(query);
  }

  @Get('stats')
  @RequirePermissions('CLIENTS.lecture')
  @ApiOperation({ summary: 'Obtenir les statistiques des clients' })
  @ApiResponse({
    status: 200,
    description: 'Statistiques des clients récupérées.',
  })
  getStats() {
    return this.clientService.getStats();
  }

  @Get(':id')
  @RequirePermissions('CLIENTS.lecture')
  @ApiOperation({ summary: 'Récupérer un client par son ID' })
  @ApiParam({ name: 'id', description: 'ID du client' })
  @ApiResponse({ status: 200, description: 'Détails du client récupérés.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.clientService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions('CLIENTS.ecriture')
  @ApiOperation({ summary: 'Mettre à jour un client' })
  @ApiParam({ name: 'id', description: 'ID du client' })
  @ApiResponse({ status: 200, description: 'Client mis à jour.' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateClientDto: UpdateClientDto,
  ) {
    return this.clientService.update(id, updateClientDto);
  }

  @Delete(':id')
  @RequirePermissions('CLIENTS.suppression')
  @ApiOperation({ summary: 'Supprimer un client' })
  @ApiParam({ name: 'id', description: 'ID du client' })
  @ApiResponse({ status: 200, description: 'Client supprimé.' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.clientService.remove(id);
  }

  @Post(':id/documents-identite')
  @RequirePermissions('CLIENTS.ecriture')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: "Téléverser un document d'identité pour un client" })
  @ApiParam({ name: 'id', description: 'ID du client' })
  @ApiResponse({ status: 201, description: 'Document téléversé avec succès.' })
  uploadDocumentIdentite(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('type') type: string,
    @Body('titre') titre: string,
    @Body('numero') numero?: string,
    @Body('dateDelivrance') dateDelivrance?: string,
    @Body('dateExpiration') dateExpiration?: string,
    @Body('lieuDelivrance') lieuDelivrance?: string,
  ) {
    if (!file) {
      throw new BadRequestException('Fichier requis');
    }

    return this.clientService.uploadDocumentIdentite(
      id,
      file,
      type,
      titre,
      numero,
      dateDelivrance ? new Date(dateDelivrance) : undefined,
      dateExpiration ? new Date(dateExpiration) : undefined,
      lieuDelivrance,
    );
  }

  @Get(':id/documents-identite')
  @RequirePermissions('CLIENTS.lecture')
  @ApiOperation({ summary: "Récupérer les documents d'identité d'un client" })
  @ApiParam({ name: 'id', description: 'ID du client' })
  @ApiResponse({ status: 200, description: "Documents d'identité récupérés." })
  getDocumentsIdentite(@Param('id', ParseUUIDPipe) id: string) {
    return this.clientService.getDocumentsIdentite(id);
  }

  @Delete(':id/documents-identite/:documentId')
  @RequirePermissions('CLIENTS.suppression')
  @ApiOperation({ summary: "Supprimer un document d'identité d'un client" })
  @ApiParam({ name: 'id', description: 'ID du client' })
  @ApiParam({ name: 'documentId', description: 'ID du document' })
  @ApiResponse({ status: 200, description: 'Document supprimé avec succès.' })
  deleteDocumentIdentite(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('documentId', ParseUUIDPipe) documentId: string,
  ) {
    return this.clientService.deleteDocumentIdentite(id, documentId);
  }
}
