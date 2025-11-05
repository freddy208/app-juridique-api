// src/dossiers/interfaces/dossier-response.interface.ts
import {
  Dossier,
  Client,
  Utilisateur,
  Document,
  Facture,
  Tache,
  Note,
  Honoraire,
  Depense,
  Provision,
} from '@prisma/client';

export interface DossierResponse extends Dossier {
  client: Client;
  responsable?: Utilisateur;
  documents: Document[];
  factures: Facture[];
  taches: Tache[];
  notes: Note[];
  honoraires: Honoraire[];
  depenses: Depense[];
  provisions: Provision[];
  sinistreCorporel?: any;
  sinistreMateriel?: any;
  sinistreMortel?: any;
  immobilier?: any;
  sport?: any;
  contrat?: any;
  contentieux?: any;
  Autre?: any; // Correction: 'Autre' avec une majuscule selon le schéma
}
