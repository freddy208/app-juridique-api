import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { TachesService } from './taches.service';
import { FilterTacheDto } from './dto/filter-tache.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiQuery, ApiParam, ApiBody } from '@nestjs/swagger';
import { CreateTacheDto } from './dto/create-tache.dto';
import { UpdateTacheDto } from './dto/update-tache.dto';
import { UpdateStatusTacheDto } from './dto/update-status-tache.dto';
//import { User } from '../auth/decorators/user.decorator';
import { CreateCommentDto } from './dto/create-comment.dto';

@ApiTags('Tâches')
@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TachesController {
  constructor(private readonly tachesService: TachesService) {}

  @Get()
  @ApiQuery({ name: 'dossierId', required: false })
  @ApiQuery({ name: 'assigneeId', required: false })
  @ApiQuery({
    name: 'statut',
    required: false,
    enum: ['A_FAIRE', 'EN_COURS', 'TERMINEE'],
  })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'skip', required: false, example: 0 })
  @ApiQuery({ name: 'take', required: false, example: 10 })
  async findAll(@Query() filters: FilterTacheDto) {
    return this.tachesService.findAll(filters);
  }
  // 🔹 Nouveau endpoint
  @Get(':id')
  @ApiParam({
    name: 'id',
    required: true,
    description: 'ID unique de la tâche',
  })
  async findOne(@Param('id') id: string) {
    return this.tachesService.findOne(id);
  }
  // 🟢 Créer une tâche
  @Post()
  async create(@Body() dto: CreateTacheDto, @Req() req) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const userId = req.user.id; // 🔒 récupéré depuis le token JWT
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return this.tachesService.create(dto, userId);
  }
  // 🟡 Mettre à jour une tâche
  @Put(':id')
  @ApiParam({
    name: 'id',
    required: true,
    description: 'ID de la tâche à modifier',
  })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTacheDto,
    @Req() req,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const userId = req.user.id;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return this.tachesService.update(id, dto, userId);
  }
  @Patch(':id/status')
  @ApiParam({
    name: 'id',
    required: true,
    description: 'ID de la tâche à modifier',
  })
  @ApiBody({ type: UpdateStatusTacheDto })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateStatusTacheDto,
    @Req() req,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const userId = req.user.id;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return this.tachesService.updateStatus(id, dto, userId);
  }
  @Delete(':id')
  @ApiParam({
    name: 'id',
    required: true,
    description: 'ID de la tâche à supprimer',
  })
  async softDelete(@Param('id') id: string, @Req() req) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const userId = req.user.id; // 🔒 récupéré depuis le token JWT
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return this.tachesService.softDelete(id, userId);
  }
  @Get(':id/comments')
  @ApiParam({
    name: 'id',
    required: true,
    description: 'ID de la tâche pour récupérer ses commentaires',
  })
  async findComments(@Param('id') id: string) {
    return this.tachesService.findCommentsByTacheId(id);
  }

  @Post(':id/comments')
  @ApiParam({
    name: 'id',
    required: true,
    description: 'ID de la tâche à commenter',
  })
  @ApiBody({ type: CreateCommentDto })
  async addComment(
    @Param('id') id: string,
    @Body() dto: CreateCommentDto,
    @Req() req,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const userId = req.user.id; // récupéré depuis le token JWT
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return this.tachesService.addComment(id, dto, userId);
  }
  @Patch(':id/comments/:commentId')
  @ApiParam({ name: 'id', required: true, description: 'ID de la tâche' })
  @ApiParam({
    name: 'commentId',
    required: true,
    description: 'ID du commentaire',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        contenu: { type: 'string', example: 'Nouveau contenu du commentaire' },
      },
      required: ['contenu'],
    },
  })
  async updateComment(
    @Param('id') tacheId: string,
    @Param('commentId') commentId: string,
    @Body('contenu') contenu: string,
    @Req() req,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const userId = req.user.id;
    return this.tachesService.updateComment(
      tacheId,
      commentId,
      contenu,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      userId,
    );
  }
  @Delete(':id/comments/:commentId')
  @ApiParam({ name: 'id', required: true, description: 'ID de la tâche' })
  @ApiParam({
    name: 'commentId',
    required: true,
    description: 'ID du commentaire',
  })
  async softDeleteComment(
    @Param('id') tacheId: string,
    @Param('commentId') commentId: string,
    @Req() req,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const userId = req.user.id; // récupéré depuis le token JWT
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return this.tachesService.softDeleteComment(tacheId, commentId, userId);
  }
}
