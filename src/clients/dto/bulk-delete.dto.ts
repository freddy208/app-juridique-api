// src/clients/dto/bulk-delete-client.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ArrayNotEmpty, IsString } from 'class-validator';

export class BulkDeleteClientDto {
  @ApiProperty({
    description: 'Liste des IDs des clients à supprimer',
    type: [String],
    example: ['uuid-1', 'uuid-2'],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  ids: string[];
}
