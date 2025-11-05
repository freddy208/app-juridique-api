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
import { ProvisionsService } from './provisions.service';
import { CreateProvisionDto } from './dto/create-provision.dto';
import { UpdateProvisionDto } from './dto/update-provision.dto';
import { AjouterMouvementDto } from './dto/ajouter-mouvement.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { RequirePermissions } from '../permissions/decorators/permissions.decorator';
import { QueryProvisionDto } from './dto/query-provision.dto';

@ApiTags('Provisions')
@Controller('provisions')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ProvisionsController {
  constructor(private readonly provisionsService: ProvisionsService) {}

  @Post()
  @RequirePermissions('PROVISIONS.ecriture')
  @ApiOperation({ summary: 'Créer une nouvelle provision' })
  @ApiResponse({ status: 201, description: 'Provision créée avec succès.' })
  create(@Body() createProvisionDto: CreateProvisionDto) {
    return this.provisionsService.create(createProvisionDto);
  }

  @Get()
  @RequirePermissions('PROVISIONS.lecture')
  @ApiOperation({ summary: 'Lister toutes les provisions' })
  @ApiResponse({ status: 200, description: 'Liste des provisions récupérée.' })
  findAll(@Query() query: QueryProvisionDto) {
    return this.provisionsService.findAll(query);
  }

  @Get('stats')
  @RequirePermissions('PROVISIONS.lecture')
  @ApiOperation({ summary: 'Obtenir les statistiques des provisions' })
  @ApiResponse({
    status: 200,
    description: 'Statistiques des provisions récupérées.',
  })
  getStats() {
    return this.provisionsService.getStats();
  }

  @Get('epuisees')
  @RequirePermissions('PROVISIONS.lecture')
  @ApiOperation({ summary: 'Lister les provisions épuisées' })
  @ApiResponse({
    status: 200,
    description: 'Liste des provisions épuisées récupérée.',
  })
  getProvisionsEpuisees(@Query() query: QueryProvisionDto) {
    return this.provisionsService.getProvisionsEpuisees(query);
  }

  @Get(':id')
  @RequirePermissions('PROVISIONS.lecture')
  @ApiOperation({ summary: 'Récupérer une provision par son ID' })
  @ApiParam({ name: 'id', description: 'ID de la provision' })
  @ApiResponse({
    status: 200,
    description: 'Détails de la provision récupérés.',
  })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.provisionsService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions('PROVISIONS.ecriture')
  @ApiOperation({ summary: 'Mettre à jour une provision' })
  @ApiParam({ name: 'id', description: 'ID de la provision' })
  @ApiResponse({ status: 200, description: 'Provision mise à jour.' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProvisionDto: UpdateProvisionDto,
  ) {
    return this.provisionsService.update(id, updateProvisionDto);
  }

  @Post(':id/mouvements')
  @RequirePermissions('PROVISIONS.ecriture')
  @ApiOperation({ summary: 'Ajouter un mouvement à une provision' })
  @ApiParam({ name: 'id', description: 'ID de la provision' })
  @ApiResponse({ status: 201, description: 'Mouvement ajouté avec succès.' })
  ajouterMouvement(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() ajouterMouvementDto: AjouterMouvementDto,
  ) {
    return this.provisionsService.ajouterMouvement(
      id,
      ajouterMouvementDto.type,
      ajouterMouvementDto.montant,
      ajouterMouvementDto.description,
    );
  }

  @Patch(':id/restituer')
  @RequirePermissions('PROVISIONS.ecriture')
  @ApiOperation({ summary: 'Marquer une provision comme restituée' })
  @ApiParam({ name: 'id', description: 'ID de la provision' })
  @ApiResponse({
    status: 200,
    description: 'Provision marquée comme restituée.',
  })
  restituerProvision(@Param('id', ParseUUIDPipe) id: string) {
    return this.provisionsService.restituerProvision(id);
  }

  @Delete(':id')
  @RequirePermissions('PROVISIONS.suppression')
  @ApiOperation({ summary: 'Supprimer une provision' })
  @ApiParam({ name: 'id', description: 'ID de la provision' })
  @ApiResponse({ status: 200, description: 'Provision supprimée.' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.provisionsService.remove(id);
  }
}
