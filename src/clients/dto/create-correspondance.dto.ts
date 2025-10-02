import { IsEnum, IsOptional, IsString } from 'class-validator';
import { TypeCorrespondance } from '@prisma/client';

export class CreateCorrespondanceDto {
  @IsEnum(TypeCorrespondance)
  type: TypeCorrespondance;

  @IsOptional()
  @IsString()
  contenu?: string;
}
