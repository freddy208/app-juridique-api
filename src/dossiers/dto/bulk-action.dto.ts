// src/dossiers/dto/bulk-action.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, IsNotEmpty } from 'class-validator';

export class BulkActionDto {
  @ApiProperty({ description: 'Liste des IDs des dossiers' })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  dossierIds: string[];
}

export class BulkAssignDto extends BulkActionDto {
  @ApiProperty({ description: 'ID du nouveau responsable' })
  @IsString()
  @IsNotEmpty()
  nouveauResponsableId: string;
}

export class ExportDossiersDto {
  @ApiProperty({ description: "Format d'export", enum: ['excel', 'pdf'] })
  @IsString()
  format: 'excel' | 'pdf';
}
