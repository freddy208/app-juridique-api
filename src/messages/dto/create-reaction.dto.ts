// src/messages/dto/create-reaction.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateReactionDto {
  @ApiProperty({
    example: 'LIKE',
    description: 'Type de réaction (LIKE, LOVE, HAHA, etc.)',
  })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({
    example: 'uuid-utilisateur',
    description: "ID de l'utilisateur qui réagit",
  })
  @IsString()
  @IsNotEmpty()
  utilisateurId: string;
}
