import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateProvisionDto } from './create-provision.dto';
import { IsOptional, IsEnum } from 'class-validator';
import { StatutProvision } from '@prisma/client';

export class UpdateProvisionDto extends PartialType(CreateProvisionDto) {
  @ApiProperty({
    description: 'Statut de la provision',
    enum: StatutProvision,
    required: false,
  })
  @IsOptional()
  @IsEnum(StatutProvision)
  statut?: StatutProvision;
}
