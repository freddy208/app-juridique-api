// dto/update-permission.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdatePermissionDto {
  @ApiProperty({ description: 'Permission lecture', required: false })
  @IsBoolean()
  @IsOptional()
  lecture?: boolean;

  @ApiProperty({ description: 'Permission écriture', required: false })
  @IsBoolean()
  @IsOptional()
  ecriture?: boolean;

  @ApiProperty({ description: 'Permission suppression', required: false })
  @IsBoolean()
  @IsOptional()
  suppression?: boolean;
}
