export interface NoteResponse {
  id: string;
  titre?: string;
  contenu: string;
  clientId?: string;
  dossierId?: string;
  utilisateurId: string;
  statut: string;
  creeLe: Date;
  modifieLe: Date;
  client?: {
    id: string;
    prenom: string;
    nom: string;
    entreprise?: string;
  };
  dossier?: {
    id: string;
    numeroUnique: string;
    titre: string;
  };
  utilisateur: {
    id: string;
    prenom: string;
    nom: string;
  };
}

export interface NoteStatsResponse {
  total: number;
  parType: {
    client: number;
    dossier: number;
  };
  parStatut: {
    actif: number;
    supprime: number;
  };
  recentes: NoteResponse[];
}
