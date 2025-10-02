import { IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class FilterCorrespondanceDto {
  @ApiPropertyOptional({ description: 'Pagination - skip', example: 0 })
  @Type(() => Number)
  @IsNumber()
  skip = 0;

  @ApiPropertyOptional({ description: 'Pagination - take', example: 10 })
  @Type(() => Number)
  @IsNumber()
  take = 10;
}
