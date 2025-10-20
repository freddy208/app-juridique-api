// src/clients/dto/filter-facture.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class FilterFactureDto {
  @ApiPropertyOptional({ description: 'Pagination - skip' })
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  skip?: number;

  @ApiPropertyOptional({ description: 'Pagination - take' })
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  take?: number;
}
