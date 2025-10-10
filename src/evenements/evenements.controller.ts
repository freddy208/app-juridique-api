// src/evenements/evenements.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiQuery, ApiParam, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EvenementsService } from './evenements.service';
import { FilterEvenementDto } from './dto/filter-evenement.dto';
import { CreateEvenementDto } from './dto/create-evenement.dto';
import { UpdateEvenementDto } from './dto/update-evenement.dto';

@ApiTags('Événements')
@Controller('events')
@UseGuards(JwtAuthGuard)
export class EvenementsController {
  constructor(private readonly evenementsService: EvenementsService) {}

  @Get()
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'dossierId', required: false })
  @ApiQuery({ name: 'creeParId', required: false })
  @ApiQuery({
    name: 'statut',
    required: false,
    enum: ['PREVU', 'TERMINE', 'ANNULE'],
  })
  @ApiQuery({ name: 'dateDebut', required: false })
  @ApiQuery({ name: 'dateFin', required: false })
  @ApiQuery({ name: 'skip', required: false, example: 0 })
  @ApiQuery({ name: 'take', required: false, example: 10 })
  async findAll(@Query() filters: FilterEvenementDto) {
    return this.evenementsService.findAll(filters);
  }
  // 🆕 Nouveau : GET /events/:id
  @Get(':id')
  @ApiParam({ name: 'id', description: "Identifiant unique de l'événement" })
  async findOne(@Param('id') id: string) {
    return this.evenementsService.findOne(id);
  }
  @Post()
  @ApiBody({ type: CreateEvenementDto })
  async create(@Body() dto: CreateEvenementDto, @Req() req) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const utilisateurId = req.user?.id;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return this.evenementsService.create(dto, utilisateurId);
  }
  @Put(':id')
  @ApiParam({
    name: 'id',
    description: "Identifiant de l'événement à modifier",
  })
  @ApiBody({ type: UpdateEvenementDto })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateEvenementDto,
    @Req() req,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const utilisateurId = req.user?.id;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return this.evenementsService.update(id, dto, utilisateurId);
  }

  // 🆕 PATCH /events/:id/status
  @Patch(':id/status')
  @ApiParam({
    name: 'id',
    description: "Identifiant unique de l'événement",
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        statut: {
          type: 'string',
          enum: ['PREVU', 'TERMINE', 'ANNULE'],
          example: 'TERMINE',
        },
      },
    },
  })
  async updateStatus(
    @Param('id') id: string,
    @Body('statut') statut: 'PREVU' | 'TERMINE' | 'ANNULE',
    @Req() req,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const utilisateurId = req.user?.id;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return this.evenementsService.updateStatus(id, statut, utilisateurId);
  }

  @Delete(':id')
  @ApiParam({
    name: 'id',
    description: "Identifiant unique de l'événement à supprimer (soft delete)",
  })
  async softDelete(@Param('id') id: string, @Req() req) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const utilisateurId = req.user?.id;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return this.evenementsService.softDelete(id, utilisateurId);
  }
}
