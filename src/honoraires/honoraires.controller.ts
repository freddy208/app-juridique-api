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
import { HonorairesService } from './honoraires.service';
import { CreateHonoraireDto } from './dto/create-honoraire.dto';
import { UpdateHonoraireDto } from './dto/update-honoraire.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { RequirePermissions } from '../permissions/decorators/permissions.decorator';
import { QueryHonoraireDto } from './dto/query-honoraire.dto';
import { StatutHonoraire } from '@prisma/client';

@ApiTags('Honoraires')
@Controller('honoraires')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class HonorairesController {
  constructor(private readonly honorairesService: HonorairesService) {}

  @Post()
  @RequirePermissions('HONORAIRES.ecriture')
  @ApiOperation({ summary: 'Créer un nouvel honoraire' })
  @ApiResponse({ status: 201, description: 'Honoraire créé avec succès.' })
  create(@Body() createHonoraireDto: CreateHonoraireDto) {
    return this.honorairesService.create(createHonoraireDto);
  }

  @Get()
  @RequirePermissions('HONORAIRES.lecture')
  @ApiOperation({ summary: 'Lister tous les honoraires' })
  @ApiResponse({ status: 200, description: 'Liste des honoraires récupérée.' })
  findAll(@Query() query: QueryHonoraireDto) {
    return this.honorairesService.findAll(query);
  }

  @Get('stats')
  @RequirePermissions('HONORAIRES.lecture')
  @ApiOperation({ summary: 'Obtenir les statistiques des honoraires' })
  @ApiResponse({
    status: 200,
    description: 'Statistiques des honoraires récupérées.',
  })
  getStats() {
    return this.honorairesService.getStats();
  }

  @Get('baremes-ohada')
  @RequirePermissions('HONORAIRES.lecture')
  @ApiOperation({ summary: 'Obtenir les barèmes OHADA' })
  @ApiResponse({
    status: 200,
    description: 'Barèmes OHADA récupérés.',
  })
  getBaremesOHADA() {
    return this.honorairesService.getBaremesOHADA();
  }

  @Get('calculer-bareme')
  @RequirePermissions('HONORAIRES.lecture')
  @ApiOperation({ summary: 'Calculer un honoraire selon un barème OHADA' })
  @ApiResponse({
    status: 200,
    description: "Calcul d'honoraire effectué.",
  })
  calculerSelonBareme(
    @Query('baremeId') baremeId: string,
    @Query('montantBase') montantBase: string,
  ) {
    return this.honorairesService.calculerHonoraireSelonBareme(
      baremeId,
      parseFloat(montantBase),
    );
  }

  @Get('en-retard')
  @RequirePermissions('HONORAIRES.lecture')
  @ApiOperation({ summary: 'Lister les honoraires en retard' })
  @ApiResponse({
    status: 200,
    description: 'Liste des honoraires en retard récupérée.',
  })
  getHonorairesEnRetard(@Query() query: QueryHonoraireDto) {
    return this.honorairesService.getHonorairesEnRetard(query);
  }

  @Get(':id')
  @RequirePermissions('HONORAIRES.lecture')
  @ApiOperation({ summary: 'Récupérer un honoraire par son ID' })
  @ApiParam({ name: 'id', description: "ID de l'honoraire" })
  @ApiResponse({
    status: 200,
    description: "Détails de l'honoraire récupérés.",
  })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.honorairesService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions('HONORAIRES.ecriture')
  @ApiOperation({ summary: 'Mettre à jour un honoraire' })
  @ApiParam({ name: 'id', description: "ID de l'honoraire" })
  @ApiResponse({ status: 200, description: 'Honoraire mis à jour.' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateHonoraireDto: UpdateHonoraireDto,
  ) {
    return this.honorairesService.update(id, updateHonoraireDto);
  }

  @Patch(':id/statut')
  @RequirePermissions('HONORAIRES.ecriture')
  @ApiOperation({ summary: "Mettre à jour le statut d'un honoraire" })
  @ApiParam({ name: 'id', description: "ID de l'honoraire" })
  @ApiResponse({
    status: 200,
    description: "Statut de l'honoraire mis à jour.",
  })
  updateStatut(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('statut') statut: StatutHonoraire,
  ) {
    return this.honorairesService.mettreAJourStatutHonoraire(id, statut);
  }

  @Delete(':id')
  @RequirePermissions('HONORAIRES.suppression')
  @ApiOperation({ summary: 'Supprimer un honoraire' })
  @ApiParam({ name: 'id', description: "ID de l'honoraire" })
  @ApiResponse({ status: 200, description: 'Honoraire supprimé.' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.honorairesService.remove(id);
  }
}
