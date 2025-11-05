export interface NotificationResponse {
  id: string;
  utilisateurId: string;
  titre: string;
  message: string;
  type: string;
  lien?: string | null; // Correction: accepter null
  lu: boolean;
  creeLe: Date;
}

export interface NotificationStatsResponse {
  total: number;
  nonLues: number;
  parType: {
    [key: string]: number;
  };
}
