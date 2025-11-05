import { Provision, MouvementProvision, Client, Dossier } from '@prisma/client';

export interface ProvisionResponse extends Provision {
  client: Pick<Client, 'id' | 'prenom' | 'nom' | 'entreprise'>;
  dossier: Pick<Dossier, 'id' | 'numeroUnique' | 'titre'>;
  mouvements: MouvementProvision[];
  tauxUtilisation: number;
}

export interface ProvisionStatsResponse {
  totalProvisions: number;
  totalDebit: number;
  totalCredit: number;
  soldeTotal: number;
  totalEpuisees: number;
  nombreProvisionsParStatut: Array<{
    statut: string;
    count: number;
    montantTotal: number;
  }>;
  provisionsParMois: Array<{
    mois: string;
    montant: number;
  }>;
  topClientsProvisions: Array<{
    id: string;
    prenom: string;
    nom: string;
    entreprise: string | null;
    totalProvision: number;
  }>;
  provisionsEpuiseesDetails: {
    count: number;
    montantTotal: number;
  };
}
