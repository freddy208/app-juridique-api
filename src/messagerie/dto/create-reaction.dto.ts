import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateReactionDto {
  @ApiProperty({ description: 'Type de réaction (ex: LIKE, LOVE, HAHA, etc.)' })
  @IsNotEmpty()
  @IsString()
  type: string;
}
