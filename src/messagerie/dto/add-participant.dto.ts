import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID, IsArray } from 'class-validator';

export class AddParticipantDto {
  @ApiProperty({ description: 'IDs des participants à ajouter' })
  @IsNotEmpty()
  @IsArray()
  @IsUUID('4', { each: true })
  participantsIds: string[];
}
