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
import { PaiementsService } from './paiments.service';
import { CreatePaiementDto } from './dto/create-paiement.dto';
import { UpdatePaiementDto } from './dto/update-paiement.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { RequirePermissions } from '../permissions/decorators/permissions.decorator';
import { QueryPaiementDto } from './dto/query-paiement.dto';

@ApiTags('Paiements')
@Controller('paiements')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class PaiementsController {
  constructor(private readonly paiementsService: PaiementsService) {}

  @Post()
  @RequirePermissions('PAIEMENTS.ecriture')
  @ApiOperation({ summary: 'Enregistrer un nouveau paiement' })
  @ApiResponse({ status: 201, description: 'Paiement enregistré avec succès.' })
  create(@Body() createPaiementDto: CreatePaiementDto) {
    return this.paiementsService.create(createPaiementDto);
  }

  @Get()
  @RequirePermissions('PAIEMENTS.lecture')
  @ApiOperation({ summary: 'Lister tous les paiements' })
  @ApiResponse({ status: 200, description: 'Liste des paiements récupérée.' })
  findAll(@Query() query: QueryPaiementDto) {
    return this.paiementsService.findAll(query);
  }

  @Get('stats')
  @RequirePermissions('PAIEMENTS.lecture')
  @ApiOperation({ summary: 'Obtenir les statistiques des paiements' })
  @ApiResponse({
    status: 200,
    description: 'Statistiques des paiements récupérées.',
  })
  getStats() {
    return this.paiementsService.getStats();
  }

  @Get(':id')
  @RequirePermissions('PAIEMENTS.lecture')
  @ApiOperation({ summary: 'Récupérer un paiement par son ID' })
  @ApiParam({ name: 'id', description: 'ID du paiement' })
  @ApiResponse({ status: 200, description: 'Détails du paiement récupérés.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.paiementsService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions('PAIEMENTS.ecriture')
  @ApiOperation({ summary: 'Mettre à jour un paiement' })
  @ApiParam({ name: 'id', description: 'ID du paiement' })
  @ApiResponse({ status: 200, description: 'Paiement mis à jour.' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePaiementDto: UpdatePaiementDto,
  ) {
    return this.paiementsService.update(id, updatePaiementDto);
  }

  @Patch(':id/valider')
  @RequirePermissions('PAIEMENTS.validation')
  @ApiOperation({ summary: 'Valider un paiement' })
  @ApiParam({ name: 'id', description: 'ID du paiement à valider' })
  @ApiResponse({ status: 200, description: 'Paiement validé.' })
  validerPaiement(@Param('id', ParseUUIDPipe) id: string) {
    return this.paiementsService.validerPaiement(id);
  }

  @Patch(':id/rejeter')
  @RequirePermissions('PAIEMENTS.validation')
  @ApiOperation({ summary: 'Rejeter un paiement' })
  @ApiParam({ name: 'id', description: 'ID du paiement à rejeter' })
  @ApiResponse({ status: 200, description: 'Paiement rejeté.' })
  rejeterPaiement(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('motif') motif: string,
  ) {
    return this.paiementsService.rejeterPaiement(id, motif);
  }

  @Delete(':id')
  @RequirePermissions('PAIEMENTS.suppression')
  @ApiOperation({ summary: 'Supprimer un paiement' })
  @ApiParam({ name: 'id', description: 'ID du paiement' })
  @ApiResponse({ status: 200, description: 'Paiement supprimé.' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.paiementsService.remove(id);
  }
}
