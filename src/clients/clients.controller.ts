import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiParam,
} from '@nestjs/swagger';
import { ClientsService } from './clients.service';
import { FilterClientDto } from './dto/filter-client.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

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
}
