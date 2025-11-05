// src/statistiques/statistiques.controller.ts
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { StatistiquesService } from './statistiques.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { RequirePermissions } from '../permissions/decorators/permissions.decorator';

@ApiTags('Statistiques')
@Controller('statistiques')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class StatistiquesController {
  constructor(private readonly statistiquesService: StatistiquesService) {}

  @Get('generales')
  @RequirePermissions('STATISTIQUES.lecture')
  @ApiOperation({ summary: 'Obtenir les statistiques générales du cabinet' })
  @ApiQuery({
    name: 'period',
    required: false,
    enum: ['mois', 'trimestre', 'annee'],
    description: 'Période des statistiques',
  })
  @ApiResponse({
    status: 200,
    description: 'Statistiques générales récupérées.',
  })
  getStatistiquesGenerales(@Query('period') period?: string) {
    return this.statistiquesService.getStatistiquesGenerales(period);
  }

  @Get('performance-avocats')
  @RequirePermissions('STATISTIQUES.lecture')
  @ApiOperation({ summary: 'Obtenir les performances des avocats' })
  @ApiQuery({
    name: 'period',
    required: false,
    enum: ['mois', 'trimestre', 'annee'],
    description: 'Période des statistiques',
  })
  @ApiQuery({
    name: 'avocatId',
    required: false,
    description: "ID de l'avocat pour filtrer",
  })
  @ApiResponse({
    status: 200,
    description: 'Performances des avocats récupérées.',
  })
  getPerformanceAvocats(
    @Query('period') period?: string,
    @Query('avocatId') avocatId?: string,
  ) {
    return this.statistiquesService.getPerformanceAvocats(period, avocatId);
  }

  @Get('financieres')
  @RequirePermissions('STATISTIQUES.lecture')
  @ApiOperation({ summary: 'Obtenir les statistiques financières' })
  @ApiQuery({
    name: 'period',
    required: false,
    enum: ['mois', 'trimestre', 'annee'],
    description: 'Période des statistiques',
  })
  @ApiResponse({
    status: 200,
    description: 'Statistiques financières récupérées.',
  })
  getStatistiquesFinancieres(@Query('period') period?: string) {
    return this.statistiquesService.getStatistiquesFinancieres(period);
  }

  @Get('dossiers')
  @RequirePermissions('STATISTIQUES.lecture')
  @ApiOperation({ summary: 'Obtenir les statistiques des dossiers' })
  @ApiQuery({
    name: 'period',
    required: false,
    enum: ['mois', 'trimestre', 'annee'],
    description: 'Période des statistiques',
  })
  @ApiResponse({
    status: 200,
    description: 'Statistiques des dossiers récupérées.',
  })
  getStatistiquesDossiers(@Query('period') period?: string) {
    return this.statistiquesService.getStatistiquesDossiers(period);
  }
}
