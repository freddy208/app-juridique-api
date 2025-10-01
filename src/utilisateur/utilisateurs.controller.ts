// src/utilisateurs/utilisateurs.controller.ts
import { Controller, Get, Query, UseGuards, Param } from '@nestjs/common';
import { UtilisateursService } from './utilisateurs.service';
import { FilterUsersDto } from './dto/filter-users.dto';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiOkResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserResponseDto } from './dto/user-response.dto';

@ApiTags('Utilisateurs')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UtilisateursController {
  constructor(private readonly utilisateursService: UtilisateursService) {}

  @ApiOperation({
    summary: 'Liste de tous les collaborateurs (filtrage par rôle, statut)',
  })
  @ApiOkResponse({ type: [UserResponseDto] })
  @Get()
  async findAll(@Query() filter: FilterUsersDto): Promise<UserResponseDto[]> {
    return this.utilisateursService.findAll(filter);
  }

  @ApiOperation({ summary: 'Détails d’un collaborateur par ID' })
  @ApiOkResponse({ type: UserResponseDto })
  @ApiNotFoundResponse({ description: 'Collaborateur introuvable' })
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<UserResponseDto> {
    return this.utilisateursService.findOne(id);
  }
}
