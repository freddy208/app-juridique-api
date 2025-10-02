import { IsOptional, IsString, IsEnum } from 'class-validator';
import { TypeCorrespondance } from '@prisma/client';

export class UpdateCorrespondanceDto {
  @IsOptional()
  @IsEnum(TypeCorrespondance)
  type?: TypeCorrespondance;

  @IsOptional()
  @IsString()
  contenu?: string;
}
