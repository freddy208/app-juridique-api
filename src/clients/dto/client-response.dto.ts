import { Client } from '@prisma/client';

export interface ClientResponse extends Omit<Client, 'chiffreAffaires'> {
  chiffreAffaires: number;
  nombreDossiers: number;
  derniereVisiteFormatee?: string;
  dateCreationFormatee: string;
  nomComplet: string;
}
