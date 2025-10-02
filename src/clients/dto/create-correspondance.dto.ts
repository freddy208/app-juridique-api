import { IsEnum, IsOptional, IsString } from 'class-validator';
import { TypeCorrespondance } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCorrespondanceDto {
  @ApiProperty({
    description: 'Type de correspondance',
    enum: TypeCorrespondance, // <- ça génère les options dans Swagger
    example: TypeCorrespondance.EMAIL,
  })
  @IsEnum(TypeCorrespondance)
  type: TypeCorrespondance;

  @ApiPropertyOptional({
    description: 'Contenu de la correspondance',
    example: 'Voici le contenu de la lettre',
  })
  @IsOptional()
  @IsString()
  contenu?: string;
}
