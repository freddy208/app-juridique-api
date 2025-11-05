import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsBoolean, IsString } from 'class-validator';

export class UpdateNotificationDto {
  @ApiProperty({ description: 'Titre de la notification', required: false })
  @IsOptional()
  @IsString()
  titre?: string;

  @ApiProperty({ description: 'Message de la notification', required: false })
  @IsOptional()
  @IsString()
  message?: string;

  @ApiProperty({
    description: 'Lien vers la ressource associée',
    required: false,
  })
  @IsOptional()
  @IsString()
  lien?: string;

  @ApiProperty({ description: 'Statut de lecture', required: false })
  @IsOptional()
  @IsBoolean()
  lu?: boolean;
}
