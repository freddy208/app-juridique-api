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
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { User } from '../auth/decorators/user.decorator';

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
    @Body() dto: CreateNoteDto,
    @User('id') utilisateurId: string,
  ) {
    return this.clientsService.createNote(clientId, utilisateurId, dto);
  }

  @ApiOperation({ summary: 'Modifier une note interne' })
  @Put('notes/:noteId')
  @ApiParam({ name: 'noteId', description: 'ID de la note à modifier' })
  async editNote(
    @Param('noteId') noteId: string,
    @Body() dto: UpdateNoteDto,
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
}
