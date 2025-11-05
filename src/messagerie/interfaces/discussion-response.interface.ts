export interface DiscussionResponse {
  id: string;
  titre?: string;
  statut: string;
  creeLe: Date;
  modifieLe: Date;
  dernierMessage?: {
    id: string;
    contenu: string;
    creeLe: Date;
    expediteur: {
      id: string;
      prenom: string;
      nom: string;
    };
  };
  nombreMessages: number;
  nombreMessagesNonLus: number;
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
  participants: {
    id: string;
    prenom: string;
    nom: string;
    role: string;
    aRejointLe: Date;
    dernierMessageLu?: Date;
  }[];
}

export interface MessageResponse {
  id: string;
  contenu: string;
  statut: string;
  creeLe: Date;
  modifieLe: Date;
  expediteur: {
    id: string;
    prenom: string;
    nom: string;
    role: string;
  };
  discussion: {
    id: string;
    titre?: string;
  };
  fichiers?: {
    id: string;
    nom: string;
    type: string;
    taille: number;
    url: string;
  }[];
  reactions: {
    id: string;
    type: string;
    creeLe: Date;
    utilisateur: {
      id: string;
      prenom: string;
      nom: string;
    };
  }[];
  estLu: boolean;
  estEdite: boolean;
}

export interface MessagerieStatsResponse {
  totalDiscussions: number;
  totalMessages: number;
  messagesNonLus: number;
  discussionsActives: number;
  topParticipants: {
    id: string;
    prenom: string;
    nom: string;
    nombreMessages: number;
  }[];
  discussionsRecentes: DiscussionResponse[];
  messagesRecents: MessageResponse[];
}
