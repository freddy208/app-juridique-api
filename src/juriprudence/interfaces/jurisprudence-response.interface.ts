export interface JurisprudenceResponse {
  id: string;
  numeroArret: string;
  juridiction: string;
  dateDecision: Date;
  parties: string;
  matiere: string;
  motsCles: string[];
  resume: string;
  texteIntegral: string;
  sensDecision: string;
  reference?: string;
  documentUrl?: string;
  creeLe: Date;
  modifieLe: Date;
  pertinenceMoyenne?: number;
  nombreDossiersAssocies?: number;
}

export interface DossierJurisprudenceResponse {
  id: string;
  dossierId: string;
  jurisprudenceId: string;
  pertinence: number;
  noteUtilisateur?: string;
  creeLe: Date;
  dossier?: {
    id: string;
    numeroUnique: string;
    titre: string;
    type: string;
    statut: string;
  };
  jurisprudence?: {
    id: string;
    numeroArret: string;
    juridiction: string;
    dateDecision: Date;
    matiere: string;
    resume: string;
  };
}

export interface JurisprudenceStatsResponse {
  totalJurisprudences: number;
  jurisprudencesParJuridiction: Array<{
    juridiction: string;
    count: number;
  }>;
  jurisprudencesParMatiere: Array<{
    matiere: string;
    count: number;
  }>;
  jurisprudencesParSensDecision: Array<{
    sensDecision: string;
    count: number;
  }>;
  jurisprudencesRecentes: JurisprudenceResponse[];
  motsClesPopulaires: Array<{
    motCle: string;
    count: number;
  }>;
}
