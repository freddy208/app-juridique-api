// src/depenses/depenses.controller.ts
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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { DepensesService } from './depenses.service';
import { CreateDepenseDto } from './dto/create-depense.dto';
import { UpdateDepenseDto } from './dto/update-depense.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { RequirePermissions } from '../permissions/decorators/permissions.decorator';
import { QueryDepenseDto } from './dto/query-depense.dto';

@ApiTags('Dépenses')
@Controller('depenses')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class DepensesController {
  constructor(private readonly depensesService: DepensesService) {}

  @Post()
  @RequirePermissions('DEPENSES.ecriture')
  @ApiOperation({ summary: 'Créer une nouvelle dépense' })
  @ApiResponse({ status: 201, description: 'Dépense créée avec succès.' })
  create(@Body() createDepenseDto: CreateDepenseDto) {
    return this.depensesService.create(createDepenseDto);
  }

  @Get()
  @RequirePermissions('DEPENSES.lecture')
  @ApiOperation({ summary: 'Lister toutes les dépenses' })
  @ApiResponse({ status: 200, description: 'Liste des dépenses récupérée.' })
  findAll(@Query() query: QueryDepenseDto) {
    return this.depensesService.findAll(query);
  }

  @Get('stats')
  @RequirePermissions('DEPENSES.lecture')
  @ApiOperation({ summary: 'Obtenir les statistiques des dépenses' })
  @ApiResponse({
    status: 200,
    description: 'Statistiques des dépenses récupérées.',
  })
  getStats() {
    return this.depensesService.getStats();
  }

  @Get('en-attente')
  @RequirePermissions('DEPENSES.validation')
  @ApiOperation({ summary: 'Lister les dépenses en attente de validation' })
  @ApiResponse({
    status: 200,
    description: 'Liste des dépenses en attente récupérée.',
  })
  getDepensesEnAttente(@Query() query: QueryDepenseDto) {
    return this.depensesService.getDepensesEnAttente(query);
  }

  @Get('dossier/:dossierId')
  @RequirePermissions('DEPENSES.lecture')
  @ApiOperation({ summary: 'Lister les dépenses par dossier' })
  @ApiParam({ name: 'dossierId', description: 'ID du dossier' })
  @ApiResponse({
    status: 200,
    description: 'Liste des dépenses du dossier récupérée.',
  })
  getDepensesByDossier(
    @Param('dossierId', ParseUUIDPipe) dossierId: string,
    @Query() query: QueryDepenseDto,
  ) {
    return this.depensesService.getDepensesByDossier(dossierId, query);
  }

  @Get(':id')
  @RequirePermissions('DEPENSES.lecture')
  @ApiOperation({ summary: 'Récupérer une dépense par son ID' })
  @ApiParam({ name: 'id', description: 'ID de la dépense' })
  @ApiResponse({ status: 200, description: 'Détails de la dépense récupérés.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.depensesService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions('DEPENSES.ecriture')
  @ApiOperation({ summary: 'Mettre à jour une dépense' })
  @ApiParam({ name: 'id', description: 'ID de la dépense' })
  @ApiResponse({ status: 200, description: 'Dépense mise à jour.' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDepenseDto: UpdateDepenseDto,
  ) {
    return this.depensesService.update(id, updateDepenseDto);
  }

  @Patch(':id/valider')
  @RequirePermissions('DEPENSES.validation')
  @ApiOperation({ summary: 'Valider une dépense' })
  @ApiParam({ name: 'id', description: 'ID de la dépense' })
  @ApiResponse({ status: 200, description: 'Dépense validée.' })
  validerDepense(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('valideParId') valideParId: string,
  ) {
    return this.depensesService.validerDepense(id, valideParId);
  }

  @Patch(':id/rejeter')
  @RequirePermissions('DEPENSES.validation')
  @ApiOperation({ summary: 'Rejeter une dépense' })
  @ApiParam({ name: 'id', description: 'ID de la dépense' })
  @ApiResponse({ status: 200, description: 'Dépense rejetée.' })
  rejeterDepense(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('valideParId') valideParId: string,
  ) {
    return this.depensesService.rejeterDepense(id, valideParId);
  }

  @Delete(':id')
  @RequirePermissions('DEPENSES.suppression')
  @ApiOperation({ summary: 'Supprimer une dépense' })
  @ApiParam({ name: 'id', description: 'ID de la dépense' })
  @ApiResponse({ status: 200, description: 'Dépense supprimée.' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.depensesService.remove(id);
  }
}
