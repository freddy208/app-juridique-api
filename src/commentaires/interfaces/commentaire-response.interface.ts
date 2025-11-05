export interface CommentaireResponse {
  id: string;
  contenu: string;
  statut: string;
  creeLe: Date;
  modifieLe: Date;
  utilisateur: {
    id: string;
    prenom: string;
    nom: string;
  };
  document?: {
    id: string;
    titre: string;
    type: string;
  };
  tache?: {
    id: string;
    titre: string;
    statut: string;
  };
}

export interface CommentaireStatsResponse {
  total: number;
  parStatut: {
    actif: number;
    supprime: number;
  };
  parType: {
    document: number;
    tache: number;
  };
  recentes: CommentaireResponse[];
}
