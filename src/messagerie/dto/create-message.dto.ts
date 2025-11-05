import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsUUID,
  IsArray,
} from 'class-validator';

export class CreateMessageDto {
  @ApiProperty({ description: 'ID de la discussion' })
  @IsNotEmpty()
  @IsUUID()
  discussionId: string;

  @ApiProperty({ description: 'Contenu du message' })
  @IsNotEmpty()
  @IsString()
  contenu: string;

  @ApiProperty({ description: 'IDs des fichiers joints', required: false })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  fichiersIds?: string[];
}
