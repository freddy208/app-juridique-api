import { IsString, IsOptional, IsDateString } from 'class-validator';

export class CreateEventDto {
  @IsString()
  titre: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  debut: string;

  @IsDateString()
  fin: string;
}
