/* eslint-disable @typescript-eslint/no-redundant-type-constituents */
import { StatutNote } from '@prisma/client';

export interface INote {
  id: string;
  clientId?: string | null;
  dossierId?: string | null;
  utilisateurId: string;
  titre?: string | null;
  contenu: string;
  statut: StatutNote;
  creeLe: Date;
  modifieLe: Date;
}

/**
 * Note avec relations (charge utile pour les endpoints qui renvoient les relations)
 */
export interface INoteWithRelations extends INote {
  client?: any | null; // remplacer any par IClientWithRelations si disponible
  dossier?: any | null; // remplacer any par IDossierWithRelations si disponible
  utilisateur?: any | null; // info minimal de l'utilisateur (id, prenom, nom)
}

/**
 * Pagination spécifique aux notes
 */
export interface IPaginatedNotes {
  data: INoteWithRelations[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Résultat pour actions en masse
 */
export interface IBulkActionResult {
  success: boolean;
  processedCount: number;
  failedCount: number;
  errors?: Array<{
    noteId: string;
    error: string;
  }>;
  message?: string;
}
