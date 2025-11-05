import { IsString, IsInt, Min, Max, IsOptional } from 'class-validator';

export class CreateDossierJurisprudenceDto {
  @IsString()
  dossierId: string;

  @IsString()
  jurisprudenceId: string;

  @IsInt()
  @Min(1)
  @Max(10)
  pertinence: number = 5;

  @IsOptional()
  @IsString()
  noteUtilisateur?: string;
}
