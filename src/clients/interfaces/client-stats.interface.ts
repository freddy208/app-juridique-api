import { Client } from '@prisma/client';

export interface ClientResponse extends Omit<Client, 'chiffreAffaires'> {
  chiffreAffaires: number;
  nombreDossiers: number;
  derniereVisiteFormatee?: string;
  dateCreationFormatee: string;
  nomComplet: string;
}

export interface ClientStatsResponse {
  totalClients: number;
  clientsActifs: number;
  clientsInactifs: number;
  clientsArchives: number;
  clientsVIP: number;
  clientsParType: {
    type: string;
    count: number;
    percentage: number;
  }[];
  clientsParVille: {
    ville: string;
    count: number;
  }[];
  topClientsParChiffreAffaires: {
    id: string;
    nomComplet: string;
    entreprise?: string;
    chiffreAffaires: number;
    nombreDossiers: number;
  }[];
  nouveauxClientsParMois: {
    mois: string;
    count: number;
  }[];
}
