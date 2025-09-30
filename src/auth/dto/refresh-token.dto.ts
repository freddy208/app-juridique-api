import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiProperty({
    example: 'uuid-utilisateur',
    description: "L'identifiant de l'utilisateur",
  })
  @IsNotEmpty()
  @IsString()
  userId: string;
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Token de rafraîchissement JWT reçu lors de la connexion',
  })
  @IsNotEmpty()
  @IsString()
  refreshToken: string;
}
