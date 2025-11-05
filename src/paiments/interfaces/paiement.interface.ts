import { Paiement, ModePaiement } from '@prisma/client';

export interface PaiementResponse extends Paiement {
  facture?: {
    id: string;
    numero: string;
    montantTotal: number;
  };
  honoraire?: {
    id: string;
    montantTTC: number;
  };
  client?: {
    id: string;
    prenom: string;
    nom: string;
    entreprise?: string;
  };
}

export interface PaiementStatsResponse {
  totalEncaisse: number;
  totalEnAttente: number;
  totalRejete: number;
  paiementsParMois: {
    mois: string; // Format "YYYY-MM"
    montant: number;
    nombre: number;
  }[];
  repartitionParMode: {
    mode: ModePaiement;
    montant: number;
    pourcentage: number;
  }[];
  topClients: {
    id: string;
    prenom: string;
    nom: string;
    entreprise?: string;
    totalVerse: number;
  }[];
  facturesImpayees: {
    count: number;
    montantTotal: number;
  };
  honorairesImpayes: {
    count: number;
    montantTotal: number;
  };
}
