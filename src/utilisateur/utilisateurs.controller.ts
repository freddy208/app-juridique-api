import {
  Controller,
  Get,
  Query,
  UseGuards,
  Param,
  Post,
  Body,
  Put,
  Patch,
  Delete,
} from '@nestjs/common';
import { UtilisateursService } from './utilisateurs.service';
import { FilterUsersDto } from './dto/filter-users.dto';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiCreatedResponse,
  ApiConflictResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserResponseDto } from './dto/user-response.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateStatusDto } from './dto/update-status.dto';

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

  @ApiOperation({ summary: 'Créer un nouveau collaborateur' })
  @ApiCreatedResponse({ type: UserResponseDto })
  @ApiConflictResponse({ description: 'Email déjà utilisé' })
  @Post()
  async create(@Body() dto: CreateUserDto): Promise<UserResponseDto> {
    return this.utilisateursService.create(dto);
  }
  @ApiOperation({ summary: 'Modifier un collaborateur par ID' })
  @ApiOkResponse({ type: UserResponseDto })
  @ApiNotFoundResponse({ description: 'Collaborateur introuvable' })
  @ApiConflictResponse({ description: 'Email déjà utilisé' })
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return this.utilisateursService.update(id, dto);
  }
  @ApiOperation({ summary: 'Activer ou désactiver un collaborateur' })
  @ApiOkResponse({ type: UserResponseDto })
  @ApiNotFoundResponse({ description: 'Collaborateur introuvable' })
  @ApiConflictResponse({ description: 'Statut déjà appliqué' })
  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto,
  ): Promise<UserResponseDto> {
    return this.utilisateursService.updateStatus(id, dto.statut);
  }
  @ApiOperation({
    summary: 'Supprimer un collaborateur (soft delete)',
  })
  @ApiOkResponse({ type: UserResponseDto })
  @ApiNotFoundResponse({ description: 'Collaborateur introuvable' })
  @ApiConflictResponse({ description: 'Collaborateur déjà inactif' })
  @Delete(':id')
  async softDelete(@Param('id') id: string): Promise<UserResponseDto> {
    return this.utilisateursService.softDelete(id);
  }
}
