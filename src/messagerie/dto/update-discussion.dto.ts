import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum } from 'class-validator';
import { StatutDiscussion } from '@prisma/client';

export class UpdateDiscussionDto {
  @ApiProperty({ description: 'Titre de la discussion', required: false })
  @IsOptional()
  @IsString()
  titre?: string;

  @ApiProperty({
    description: 'Statut de la discussion',
    enum: StatutDiscussion,
    required: false,
  })
  @IsOptional()
  @IsEnum(StatutDiscussion)
  statut?: StatutDiscussion;
}
