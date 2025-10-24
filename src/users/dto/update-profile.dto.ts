import { OmitType, ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  MinLength,
  Matches,
  ValidateIf,
} from 'class-validator';
import { UpdateUserDto } from './update-user.dto';

export class UpdateProfileDto extends OmitType(UpdateUserDto, [
  'role',
  'statut',
] as const) {
  // L'utilisateur ne peut pas changer son propre rôle ou statut

  @ApiProperty({
    example: 'OldP@ss123',
    required: false,
    description: 'Requis si vous changez le mot de passe',
  })
  @IsString()
  @IsOptional()
  ancienMotDePasse?: string;

  @ApiProperty({
    example: 'NewStrongP@ss123',
    required: false,
    description: 'Nouveau mot de passe (requiert ancienMotDePasse)',
  })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      'Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un symbole',
  })
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  @ValidateIf((o) => o.ancienMotDePasse !== undefined)
  @IsOptional()
  nouveauMotDePasse?: string;
}
