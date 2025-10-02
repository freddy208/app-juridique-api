// src/clients/dto/filter-note.dto.ts
import { IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class FilterNoteDto {
  @ApiPropertyOptional({ description: 'Pagination - skip', example: 0 })
  @Type(() => Number)
  @IsNumber()
  skip = 0;

  @ApiPropertyOptional({ description: 'Pagination - take', example: 10 })
  @Type(() => Number)
  @IsNumber()
  take = 10;
}
