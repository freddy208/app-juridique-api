// src/depenses/interfaces/depense-response.interface.ts
import { Depense } from '@prisma/client';

// Définissons un type pour le dossier partiel que nous renvoyons
export interface DossierPartiel {
  id: string;
  numeroUnique: string;
  titre: string;
}

export interface DepenseResponse extends Depense {
  dossier?: DossierPartiel | null;
}
