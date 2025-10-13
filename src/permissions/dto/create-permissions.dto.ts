import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsBoolean } from 'class-validator';

export class PermissionDto {
  @ApiProperty({ description: 'Nom du module' })
  @IsString()
  module: string;

  @ApiProperty({ description: 'Permission lecture', default: true })
  @IsBoolean()
  lecture: boolean;

  @ApiProperty({ description: 'Permission écriture', default: false })
  @IsBoolean()
  ecriture: boolean;

  @ApiProperty({ description: 'Permission suppression', default: false })
  @IsBoolean()
  suppression: boolean;
}

export class PermissionsByRoleDto {
  @ApiProperty({
    type: [PermissionDto],
    description: 'Liste des permissions à ajouter ou modifier',
  })
  permissions: PermissionDto[];
}
