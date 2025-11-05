// interfaces/document-response.interface.ts
import { Document, StatutDocument } from '@prisma/client';

export interface DocumentResponse extends Document {
  utilisateur?: {
    id: string;
    prenom: string;
    nom: string;
  };
  dossier?: {
    id: string;
    numeroUnique: string;
    titre: string;
  };
}

export interface DocumentStatsResponse {
  totalDocuments: number;
  tailleTotale: number;
  documentsIndexes: number;
  documentsParType: Array<{
    type: string;
    count: number;
  }>;
  documentsParStatut: Array<{
    statut: StatutDocument;
    count: number;
  }>;
  documentsParMois: Array<{
    mois: string;
    nombre: number;
  }>;
}
