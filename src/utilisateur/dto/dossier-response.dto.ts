import { ApiProperty } from '@nestjs/swagger';

export class DossierResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  numeroUnique: string;

  @ApiProperty()
  titre: string;

  @ApiProperty()
  type: string;

  @ApiProperty()
  statut: string;

  @ApiProperty()
  creeLe: Date;

  @ApiProperty()
  modifieLe: Date;

  @ApiProperty({ type: Object })
  client: {
    id: string;
    prenom: string;
    nom: string;
    nomEntreprise?: string;
  };
}
