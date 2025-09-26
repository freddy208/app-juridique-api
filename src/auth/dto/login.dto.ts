import { IsEmail, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    example: 'user@test.com',
    description: "L'email de l'utilisateur pour la connexion",
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: '123456',
    description: "Le mot de passe de l'utilisateur",
  })
  @IsString()
  motDePasse: string;
}
