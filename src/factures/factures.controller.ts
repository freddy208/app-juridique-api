import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Post,
  Body,
  Put,
  Patch,
  Delete,
} from '@nestjs/common';
import { FacturesService } from './factures.service';
import { FilterInvoiceDto } from './dto/filter-invoice.dto';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  ApiTags,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
  ApiBody,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { StatutFacture } from '@prisma/client';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { UpdateStatusInvoiceDto } from './dto/update-status-invoice.dto';

@ApiTags('Factures')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('invoices')
export class FacturesController {
  constructor(private readonly facturesService: FacturesService) {}

  @Get()
  @ApiQuery({ name: 'clientId', required: false })
  @ApiQuery({ name: 'dossierId', required: false })
  @ApiQuery({ name: 'statut', required: false, enum: StatutFacture })
  @ApiQuery({ name: 'recherche', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(@Query() filterDto: FilterInvoiceDto) {
    return this.facturesService.findAll(filterDto);
  }

  @Get(':id')
  @ApiParam({ name: 'id', description: 'ID de la facture à récupérer' })
  async findOne(@Param('id') id: string) {
    return this.facturesService.findOne(id);
  }

  @Post()
  @ApiBody({
    type: CreateInvoiceDto,
    description: 'Données pour créer une facture',
  })
  async create(@Body() createInvoiceDto: CreateInvoiceDto) {
    return this.facturesService.create(createInvoiceDto);
  }
  @Put(':id')
  @ApiParam({ name: 'id', description: 'ID de la facture à modifier' })
  @ApiBody({
    type: UpdateInvoiceDto,
    description: 'Données pour modifier la facture',
  })
  async update(
    @Param('id') id: string,
    @Body() updateInvoiceDto: UpdateInvoiceDto,
  ) {
    return this.facturesService.update(id, updateInvoiceDto);
  }
  @Patch(':id/status')
  @ApiParam({ name: 'id', description: 'ID de la facture à mettre à jour' })
  @ApiBody({ type: UpdateStatusInvoiceDto, description: 'Nouveau statut' })
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateStatusInvoiceDto,
  ) {
    const { statut } = updateStatusDto;
    return this.facturesService.updateStatus(id, statut);
  }
  // src/factures/factures.controller.ts
  @Patch(':id/pay')
  @ApiOperation({ summary: 'Marquer une facture comme payée' })
  @ApiResponse({
    status: 200,
    description: 'Facture marquée comme payée avec succès.',
  })
  @ApiResponse({ status: 404, description: 'Facture introuvable.' })
  @ApiResponse({ status: 400, description: 'Erreur lors de la mise à jour.' })
  @ApiParam({
    name: 'id',
    description: 'ID de la facture à marquer comme payée',
  })
  async markAsPaid(@Param('id') id: string) {
    return this.facturesService.markAsPaid(id);
  }
  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une facture (soft delete)' })
  @ApiResponse({
    status: 200,
    description: 'Facture supprimée avec succès (soft delete).',
  })
  @ApiResponse({ status: 404, description: 'Facture introuvable.' })
  @ApiResponse({ status: 400, description: 'Erreur lors de la suppression.' })
  @ApiParam({ name: 'id', description: 'ID de la facture à supprimer' })
  async softDelete(@Param('id') id: string) {
    return this.facturesService.softDelete(id);
  }
}
