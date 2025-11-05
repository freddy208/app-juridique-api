import { PartialType } from '@nestjs/mapped-types';
import { CreateClientDto } from './create-client.dto';
import { TypeClient, StatutClient } from '@prisma/client';
import { IsEnum, IsOptional, IsBoolean } from 'class-validator';

export class UpdateClientDto extends PartialType(CreateClientDto) {
  @IsOptional()
  @IsEnum(TypeClient)
  override typeClient?: TypeClient;

  @IsOptional()
  @IsEnum(StatutClient)
  override statut?: StatutClient;

  @IsOptional()
  @IsBoolean()
  override estVIP?: boolean;
}
