export interface EvenementResponse {
  id: string;
  titre: string;
  description?: string;
  debut: Date;
  fin: Date;
  statut: string;
  creeLe: Date;
  modifieLe: Date;
  estPasse: boolean;
  estEnCours: boolean;
  dureeMinutes: number;
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
}

export interface EvenementStatsResponse {
  total: number;
  parStatut: {
    prevu: number;
    termine: number;
    annule: number;
  };
  ceMois: number;
  cetteSemaine: number;
  aujourdHui: number;
  aVenir: number;
  passes: number;
  parUtilisateur: Array<{
    id: string;
    prenom: string;
    nom: string;
    total: number;
    completes: number;
    enRetard: number;
    tauxCompletion: number;
  }>; // Corrigé pour éviter le type never[]
  recentes: EvenementResponse[];
  aVenirProchains: EvenementResponse[];
}
