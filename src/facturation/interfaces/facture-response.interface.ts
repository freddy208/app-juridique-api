import { Facture, StatutFacture, LigneFacture } from '@prisma/client';

export interface FactureResponse extends Facture {
  client: {
    id: string;
    prenom: string;
    nom: string;
    entreprise?: string | null;
  };
  dossier?: {
    id: string;
    numeroUnique: string;
    titre: string;
  };
  lignes: LigneFacture[];
  montantRestant: number; // Calculé : montantTotal - montantPaye
  enRetard: boolean; // Calculé : dateEcheance < now && statut != PAYEE
}

export interface FactureStatsResponse {
  totalEmis: number;
  totalPaye: number;
  totalEnRetard: number;
  totalImpaye: number;
  nombreFacturesParStatut: {
    statut: StatutFacture;
    count: number;
    montantTotal: number;
  }[];
  chiffreAffairesParMois: {
    mois: string; // Format "YYYY-MM"
    montant: number;
  }[];
  topClientsFactures: {
    id: string;
    prenom: string;
    nom: string;
    entreprise?: string | null;
    totalFacture: number;
  }[];
  facturesEnRetardDetails: {
    count: number;
    montantTotal: number;
  };
}
