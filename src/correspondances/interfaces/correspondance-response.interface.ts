export interface CorrespondanceResponse {
  id: string;
  type: string;
  contenu: string;
  clientId: string;
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
  utilisateur: {
    id: string;
    prenom: string;
    nom: string;
  };
}

export interface CorrespondanceStatsResponse {
  total: number;
  parType: {
    [key: string]: number;
  };
  parStatut: {
    [key: string]: number;
  };
  recentes: CorrespondanceResponse[];
}
