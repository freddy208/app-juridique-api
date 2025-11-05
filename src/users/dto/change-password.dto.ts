import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangerPasswordDto {
  @ApiProperty({
    description: 'Ancien mot de passe',
    example: 'OldPassword123!',
  })
  @IsNotEmpty()
  @IsString()
  ancienMotDePasse: string;

  @ApiProperty({
    description: 'Nouveau mot de passe',
    example: 'NewPassword123!',
  })
  @IsNotEmpty()
  @MinLength(8)
  @IsString()
  nouveauMotDePasse: string;
}
