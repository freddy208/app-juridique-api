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
import { FacturesService } from './facturation.service';
import { CreateFactureDto } from './dto/create-facture.dto';
import { UpdateFactureDto } from './dto/update-facture.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { RequirePermissions } from '../permissions/decorators/permissions.decorator';
import { QueryFactureDto } from './dto/query-facture.dto';

@ApiTags('Factures')
@Controller('factures')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class FacturesController {
  constructor(private readonly facturesService: FacturesService) {}

  @Post()
  @RequirePermissions('FACTURES.ecriture')
  @ApiOperation({ summary: 'Créer une nouvelle facture' })
  @ApiResponse({ status: 201, description: 'Facture créée avec succès.' })
  create(@Body() createFactureDto: CreateFactureDto) {
    return this.facturesService.create(createFactureDto);
  }

  @Get()
  @RequirePermissions('FACTURES.lecture')
  @ApiOperation({ summary: 'Lister toutes les factures' })
  @ApiResponse({ status: 200, description: 'Liste des factures récupérée.' })
  findAll(@Query() query: QueryFactureDto) {
    return this.facturesService.findAll(query);
  }

  @Get('stats')
  @RequirePermissions('FACTURES.lecture')
  @ApiOperation({ summary: 'Obtenir les statistiques des factures' })
  @ApiResponse({
    status: 200,
    description: 'Statistiques des factures récupérées.',
  })
  getStats() {
    return this.facturesService.getStats();
  }

  @Get('en-retard')
  @RequirePermissions('FACTURES.lecture')
  @ApiOperation({ summary: 'Lister les factures en retard' })
  @ApiResponse({
    status: 200,
    description: 'Liste des factures en retard récupérée.',
  })
  getFacturesEnRetard(@Query() query: QueryFactureDto) {
    return this.facturesService.getFacturesEnRetard(query);
  }

  @Get(':id')
  @RequirePermissions('FACTURES.lecture')
  @ApiOperation({ summary: 'Récupérer une facture par son ID' })
  @ApiParam({ name: 'id', description: 'ID de la facture' })
  @ApiResponse({ status: 200, description: 'Détails de la facture récupérés.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.facturesService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions('FACTURES.ecriture')
  @ApiOperation({ summary: 'Mettre à jour une facture' })
  @ApiParam({ name: 'id', description: 'ID de la facture' })
  @ApiResponse({ status: 200, description: 'Facture mise à jour.' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateFactureDto: UpdateFactureDto,
  ) {
    return this.facturesService.update(id, updateFactureDto);
  }

  @Patch(':id/envoyer')
  @RequirePermissions('FACTURES.ecriture')
  @ApiOperation({ summary: 'Marquer une facture comme envoyée' })
  @ApiParam({ name: 'id', description: 'ID de la facture' })
  @ApiResponse({ status: 200, description: 'Facture marquée comme envoyée.' })
  envoyerFacture(@Param('id', ParseUUIDPipe) id: string) {
    return this.facturesService.envoyerFacture(id);
  }

  @Delete(':id')
  @RequirePermissions('FACTURES.suppression')
  @ApiOperation({ summary: 'Supprimer une facture' })
  @ApiParam({ name: 'id', description: 'ID de la facture' })
  @ApiResponse({ status: 200, description: 'Facture supprimée.' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.facturesService.remove(id);
  }
}
