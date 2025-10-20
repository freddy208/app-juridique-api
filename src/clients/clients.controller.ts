// src/clients/clients.controller.ts
import {
  Controller,
  Get,
  Query,
  Param,
  Post,
  Put,
  Patch,
  Body,
  Delete,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiParam,
} from '@nestjs/swagger';
import { ClientsService } from './clients.service';
import { FilterClientDto } from './dto/filter-client.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { UpdateClientStatusDto } from './dto/update-client-status.dto';
import { FilterDossierDto } from './dto/filter-dossier.dto';
import { FilterDocumentDto } from './dto/filter-document.dto';
import { FilterNoteDto } from './dto/filter-note.dto';
import { CreateClientNoteDto } from './dto/create-client-note.dto';
import { UpdateClientNoteDto } from './dto/update-client-note.dto';
import { User } from '../auth/decorators/user.decorator';
import { CreateCorrespondanceDto } from './dto/create-correspondance.dto';
import { UpdateCorrespondanceDto } from './dto/update-correspondance.dto';
import { FilterCorrespondanceDto } from './dto/filter-correspondance.dto';

@ApiTags('clients')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  @ApiOperation({ summary: 'Liste des clients (avec filtres)' })
  async findAll(@Query() filters: FilterClientDto) {
    return this.clientsService.findAll(filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détails d’un client' })
  @ApiParam({ name: 'id', description: 'ID du client', type: String })
  async findOne(@Param('id') id: string) {
    return this.clientsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Créer un client' })
  async create(@Body() data: CreateClientDto) {
    return this.clientsService.create(data);
  }
  @Put(':id')
  @ApiOperation({ summary: 'Modifier un client' })
  @ApiParam({ name: 'id', description: 'ID du client', type: String })
  async update(@Param('id') id: string, @Body() data: UpdateClientDto) {
    return this.clientsService.update(id, data);
  }
  @Patch(':id/status')
  @ApiOperation({ summary: 'Activer ou désactiver un client' })
  @ApiParam({ name: 'id', description: 'ID du client', type: String })
  async updateStatus(
    @Param('id') id: string,
    @Body() body: UpdateClientStatusDto,
  ) {
    return this.clientsService.updateStatus(id, body.statut);
  }
  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un client (soft delete)' })
  @ApiParam({ name: 'id', description: 'ID du client', type: String })
  async remove(@Param('id') id: string) {
    return this.clientsService.remove(id);
  }

  @Get(':id/dossiers')
  @ApiOperation({ summary: 'Lister les dossiers d’un client' })
  @ApiParam({ name: 'id', description: 'ID du client', type: String })
  async getDossiers(
    @Param('id') id: string,
    @Query() filters: FilterDossierDto,
  ) {
    const skip = Number(filters.skip ?? 0);
    const take = Number(filters.take ?? 10);
    return this.clientsService.findDossiersByClient(
      id,
      filters.statutDossier,
      skip,
      take,
    );
  }
  @Get(':id/documents')
  @ApiOperation({ summary: 'Lister les documents liés à un client' })
  @ApiParam({ name: 'id', description: 'ID du client', type: String })
  async getDocuments(
    @Param('id') id: string,
    @Query() filters: FilterDocumentDto,
  ) {
    const skip = Number(filters.skip ?? 0);
    const take = Number(filters.take ?? 10);
    return this.clientsService.findDocumentsByClient(
      id,
      filters.statut,
      skip,
      take,
    );
  }
  @Get(':id/notes')
  @ApiOperation({ summary: 'Lister les notes internes d’un client' })
  @ApiParam({ name: 'id', description: 'ID du client', type: String })
  async getNotes(@Param('id') id: string, @Query() filters: FilterNoteDto) {
    const skip = Number(filters.skip ?? 0);
    const take = Number(filters.take ?? 10);
    return this.clientsService.findNotesByClient(id, skip, take);
  }
  @ApiOperation({ summary: 'Ajouter une note interne pour un client' })
  @Post(':id/notes')
  @ApiParam({ name: 'id', description: 'ID du client' })
  async addNote(
    @Param('id') clientId: string,
    @Body() dto: CreateClientNoteDto,
    @User('id') utilisateurId: string,
  ) {
    return this.clientsService.createNote(clientId, utilisateurId, dto);
  }

  @ApiOperation({ summary: 'Modifier une note interne' })
  @Put('notes/:noteId')
  @ApiParam({ name: 'noteId', description: 'ID de la note à modifier' })
  async editNote(
    @Param('noteId') noteId: string,
    @Body() dto: UpdateClientNoteDto,
    @User('id') utilisateurId: string,
  ) {
    return this.clientsService.updateNote(noteId, utilisateurId, dto);
  }

  @ApiOperation({ summary: 'Supprimer une note interne' })
  @Delete('notes/:noteId')
  @ApiParam({ name: 'noteId', description: 'ID de la note à supprimer' })
  async deleteNote(
    @Param('noteId') noteId: string,
    @User('id') utilisateurId: string,
  ) {
    return this.clientsService.removeNote(noteId, utilisateurId);
  }
  @Get(':id/correspondances')
  @ApiOperation({ summary: 'Lister les correspondances d’un client' })
  async getCorrespondances(
    @Param('id') clientId: string,
    @Query() filters: FilterCorrespondanceDto,
  ) {
    const skip = Number(filters.skip ?? 0);
    const take = Number(filters.take ?? 10);
    return this.clientsService.findCorrespondancesByClient(
      clientId,
      skip,
      take,
    );
  }

  @Post(':id/correspondances')
  @ApiOperation({ summary: 'Créer une correspondance pour un client' })
  async addCorrespondance(
    @Param('id') clientId: string,
    @Body() dto: CreateCorrespondanceDto,
    @User('id') utilisateurId: string,
  ) {
    return this.clientsService.createCorrespondance(
      clientId,
      utilisateurId,
      dto,
    );
  }

  @Put('correspondances/:correspondanceId')
  @ApiOperation({ summary: 'Modifier une correspondance' })
  async editCorrespondance(
    @Param('correspondanceId') correspondanceId: string,
    @Body() dto: UpdateCorrespondanceDto,
    @User('id') utilisateurId: string,
  ) {
    return this.clientsService.updateCorrespondance(
      correspondanceId,
      utilisateurId,
      dto,
    );
  }

  @Delete('correspondances/:correspondanceId')
  @ApiOperation({ summary: 'Supprimer une correspondance (soft delete)' })
  async deleteCorrespondance(
    @Param('correspondanceId') correspondanceId: string,
    @User('id') utilisateurId: string,
  ) {
    return this.clientsService.removeCorrespondance(
      correspondanceId,
      utilisateurId,
    );
  }
  // nouvelles routes generer par claude AI
  // 1. Suppression en masse
  @Delete()
  @ApiOperation({ summary: 'Supprimer plusieurs clients (bulk soft delete)' })
  async bulkDelete(@Body() body: { ids: string[] }) {
    return this.clientsService.bulkDelete(body.ids);
  }
  // 2. Export Excel
  @Get('export')
  @ApiOperation({ summary: 'Exporter la liste des clients en Excel' })
  async exportClients(@Query() filters: FilterClientDto) {
    const clients = await this.clientsService.exportToExcel(filters);
    // Transformation des données pour Excel
    return clients.map((client) => ({
      Prénom: client.prenom,
      Nom: client.nom,
      Entreprise: client.nomEntreprise || 'N/A',
      Email: client.email || 'N/A',
      Téléphone: client.telephone || 'N/A',
      Adresse: client.adresse || 'N/A',
      Statut: client.statut,
      'Nb Dossiers': client.dossiers?.length || 0,
      'CA Total':
        client.factures?.reduce((sum, f) => sum + Number(f.montant), 0) || 0,
      'Créé le': client.creeLe.toISOString(),
    }));
  }
  // 4. Audit du client
  @Get(':id/audit')
  @ApiOperation({ summary: "Historique d'audit d'un client" })
  @ApiParam({ name: 'id', description: 'ID du client', type: String })
  async getAudit(
    @Param('id') id: string,
    @Query('skip') skip?: number,
    @Query('take') take?: number,
  ) {
    return this.clientsService.findAuditByClient(id, skip, take);
  }
  // 3. Factures du client
  @Get(':id/factures')
  @ApiOperation({ summary: "Lister les factures d'un client" })
  @ApiParam({ name: 'id', description: 'ID du client', type: String })
  async getFactures(
    @Param('id') id: string,
    @Query('skip') skip?: number,
    @Query('take') take?: number,
  ) {
    return this.clientsService.findFacturesByClient(id, skip, take);
  }
}
