export interface TacheResponse {
  id: string;
  titre: string;
  description?: string;
  statut: string;
  priorite: string;
  dateLimite?: Date;
  creeLe: Date;
  modifieLe: Date;
  tags?: string;
  enRetard: boolean;
  joursRestants?: number;
  assignee?: {
    id: string;
    prenom: string;
    nom: string;
    role: string;
  };
  createur: {
    id: string;
    prenom: string;
    nom: string;
    role: string;
  };
  dossier?: {
    id: string;
    numeroUnique: string;
    titre: string;
    type: string;
    statut: string;
  };
  commentaires?: {
    id: string;
    contenu: string;
    creeLe: Date;
    utilisateur: {
      id: string;
      prenom: string;
      nom: string;
    };
  }[];
}

export interface TacheStatsResponse {
  total: number;
  parStatut: {
    a_faire: number;
    en_cours: number;
    terminee: number;
  };
  parPriorite: {
    basse: number;
    moyenne: number;
    haute: number;
    urgente: number;
  };
  enRetard: number;
  aEcheanceProche: number;
  parUtilisateur: {
    id: string;
    prenom: string;
    nom: string;
    total: number;
    completes: number;
    enRetard: number;
    tauxCompletion: number;
  }[];
  recentes: TacheResponse[];
}
