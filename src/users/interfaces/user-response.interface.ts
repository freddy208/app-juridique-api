export interface UserResponse {
  id: string;
  prenom: string;
  nom: string;
  email: string;
  telephone?: string | null; // Correction: accepter null
  adresse?: string | null; // Correction: accepter null
  specialite?: string | null; // Correction: accepter null
  barreau?: string | null; // Correction: accepter null
  numeroPermis?: string | null; // Correction: accepter null
  role: string;
  statut: string;
  creeLe: Date;
  modifieLe: Date;
  derniereConnexion?: Date | null; // Correction: accepter null
}

export interface UserStatsResponse {
  totalDossiers: number;
  dossiersActifs: number;
  dossiersClos: number;
  totalTaches: number;
  tachesEnCours: number;
  tachesTerminees: number;
  totalEvenements: number;
  evenementsAVenir: number;
  chiffreAffaires: number; // Gardé comme number
  tauxVictoire?: number;
}
