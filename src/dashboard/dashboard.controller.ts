import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { CustomReportDto } from './dto/custom-report.dto';

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dashboard/reports')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('dossiers')
  @ApiOperation({ summary: 'Statistiques des dossiers (par type et statut)' })
  @ApiResponse({
    status: 200,
    description: 'Retourne les statistiques des dossiers',
  })
  @ApiResponse({ status: 400, description: 'Erreur récupération stats' })
  async getDossiersStats() {
    return this.dashboardService.getDossiersStats();
  }
  @Get('tasks')
  @ApiOperation({
    summary: 'Statistiques des tâches par collaborateur et statut',
  })
  @ApiResponse({
    status: 200,
    description: 'Retourne les statistiques des tâches',
  })
  @ApiResponse({ status: 400, description: 'Erreur récupération stats' })
  async getTasksStats() {
    return this.dashboardService.getTasksStats();
  }
  @Get('custom')
  @ApiOperation({ summary: 'Rapport personnalisé avec filtres' })
  @ApiResponse({ status: 200, description: 'Retourne les dossiers filtrés' })
  @ApiResponse({ status: 400, description: 'Erreur récupération rapport' })
  async getCustomReport(@Query() filters: CustomReportDto) {
    return this.dashboardService.getCustomReport(filters);
  }
  @Get('finance')
  @ApiOperation({ summary: 'Rapport financier : factures et revenus' })
  @ApiResponse({ status: 200, description: 'Retourne le rapport financier' })
  @ApiResponse({
    status: 400,
    description: 'Erreur récupération rapport financier',
  })
  async getFinanceReport(
    @Query('clientId') clientId?: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    return this.dashboardService.getFinanceReport({ clientId, start, end });
  }
}
