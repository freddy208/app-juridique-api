// src/messages/messages.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { FilterMessageDto } from './dto/filter-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  ApiTags,
  ApiQuery,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { CreateReactionDto } from './dto/create-reaction.dto';

@ApiTags('Chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get()
  @ApiQuery({ name: 'dossierId', required: false })
  @ApiQuery({ name: 'expediteurId', required: false })
  @ApiQuery({ name: 'statut', required: false, enum: ['ENVOYE', 'LU'] })
  @ApiQuery({ name: 'recherche', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(@Query() filterDto: FilterMessageDto) {
    return this.messagesService.findAll(filterDto);
  }
  // ✅ NOUVEL ENDPOINT : /chat/:id
  @Get(':id')
  @ApiParam({ name: 'id', required: true, description: 'ID du message' })
  async findOne(@Param('id') id: string) {
    return this.messagesService.findOne(id);
  }
  // ✅ Envoyer un message
  @Post()
  @ApiBody({ type: CreateMessageDto })
  async create(@Body() dto: CreateMessageDto) {
    return this.messagesService.create(dto);
  }
  @Patch(':id')
  @ApiParam({
    name: 'id',
    required: true,
    description: 'ID du message à modifier',
  })
  @ApiBody({ type: UpdateMessageDto })
  async update(@Param('id') id: string, @Body() dto: UpdateMessageDto) {
    return this.messagesService.update(id, dto);
  }
  // ✅ Soft delete d’un message
  @Delete(':id')
  @ApiParam({
    name: 'id',
    required: true,
    description: 'ID du message à supprimer (soft delete)',
  })
  async remove(@Param('id') id: string) {
    return this.messagesService.remove(id);
  }
  @Get(':id/reactions')
  @ApiParam({ name: 'id', required: true, description: 'ID du message' })
  async getReactions(@Param('id') id: string) {
    return this.messagesService.getReactions(id);
  }

  @Post(':id/reactions')
  @ApiParam({ name: 'id', required: true, description: 'ID du message' })
  @ApiBody({ type: CreateReactionDto })
  async addReaction(@Param('id') id: string, @Body() dto: CreateReactionDto) {
    return this.messagesService.addReaction(id, dto);
  }
}
