// interfaces/client.interface.ts
import { StatutClient } from '@prisma/client';

export interface IClient {
  id: string;
  prenom: string;
  nom: string;
  nomEntreprise?: string | null;
  telephone?: string | null;
  email?: string | null;
  adresse?: string | null;
  statut: StatutClient;
  chiffreAffaires?: number | null;
  statutVIP: boolean;
  derniereVisite?: Date | null;
  creeLe: Date;
  modifieLe: Date;
}

export interface IClientWithRelations extends IClient {
  dossiers?: any[];
  factures?: any[];
  notes?: any[];
  documentIdentite?: any[];
  honoraires?: any[];
  paiements?: any[];
  provisions?: any[];
  communicationClient?: any[];
  satisfaction?: any[];
}

export interface IClientStats {
  totalDossiers: number;
  dossiersActifs: number;
  dossiersFermes: number;
  totalFactures: number;
  facturesPayees: number;
  facturesImpayees: number;
  totalHonoraires: number;
  totalPaiements: number;
  soldeRestant: number;
  chiffreAffaires: number;
}

export interface IClientPerformance {
  tauxReussite: number;
  delaiMoyenTraitement: number;
  satisfactionMoyenne: number;
  nombreEvaluations: number;
}

export interface IClientActivity {
  id: string;
  type: 'DOSSIER' | 'FACTURE' | 'PAIEMENT' | 'NOTE' | 'COMMUNICATION';
  description: string;
  date: Date;
}

export interface IPaginatedClients {
  data: IClientWithRelations[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface IClientFinancialSummary {
  totalHonoraires: number;
  totalPaiements: number;
  totalFactures: number;
  facturesImpayees: number;
  soldeRestant: number;
  provisionsDisponibles: number;
}

export interface IBulkActionResult {
  success: boolean;
  processedCount: number;
  failedCount: number;
  errors?: Array<{
    clientId: string;
    error: string;
  }>;
  message: string;
}
