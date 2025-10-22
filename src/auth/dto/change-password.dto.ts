import { IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @MinLength(6)
  ancienMotDePasse: string;

  @IsString()
  @MinLength(6)
  nouveauMotDePasse: string;
}
