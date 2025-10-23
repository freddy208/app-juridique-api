import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';
import { RoleUtilisateur, StatutUtilisateur } from '@prisma/client';

export class BulkActionDto {
  @IsArray()
  @IsString({ each: true })
  userIds: string[];

  @IsEnum(['changeRole', 'changeStatus', 'delete'])
  action: 'changeRole' | 'changeStatus' | 'delete';

  @IsEnum(RoleUtilisateur)
  @IsOptional()
  role?: RoleUtilisateur;

  @IsEnum(StatutUtilisateur)
  @IsOptional()
  statut?: StatutUtilisateur;

  @IsString()
  @IsOptional()
  raison?: string;
}
