import { Honoraire, Paiement } from '@prisma/client';

export interface HonoraireResponse extends Honoraire {
  client: {
    id: string;
    prenom: string;
    nom: string;
    entreprise: string | null;
  };
  dossier: {
    id: string;
    numeroUnique: string;
    titre: string;
  };
  paiements: Paiement[];
  montantRestant: number;
  enRetard: boolean;
  tauxRecouvrement: number;
}

export interface HonoraireStatsResponse {
  totalEmis: number;
  totalPaye: number;
  totalEnRetard: number;
  totalImpaye: number;
  nombreHonorairesParStatut: Array<{
    statut: string;
    count: number;
    montantTotal: number;
  }>;
  nombreHonorairesParType: Array<{
    type: string;
    count: number;
    montantTotal: number;
  }>;
  chiffreAffairesParMois: Array<{
    mois: string;
    montant: number;
  }>;
  topClientsHonoraires: Array<{
    id: string;
    prenom: string;
    nom: string;
    entreprise: string | null;
    totalHonoraire: number;
  }>;
  honorairesEnRetardDetails: {
    count: number;
    montantTotal: number;
  };
}

export interface BaremeOHADA {
  id: string;
  nom: string;
  description: string;
  tranches: Array<{
    min: number;
    max: number;
    taux: number;
    fixe: number;
  }>;
}
