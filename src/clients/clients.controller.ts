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
}
