// src/depenses/dto/update-depense.dto.ts
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateDepenseDto } from './create-depense.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { StatutDepense } from '@prisma/client';

export class UpdateDepenseDto extends PartialType(CreateDepenseDto) {
  @ApiProperty({
    enum: StatutDepense,
    description: 'Statut de la dépense',
    required: false,
  })
  @IsOptional()
  @IsEnum(StatutDepense)
  statut?: StatutDepense;
}
