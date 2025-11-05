// src/dashboard/interfaces/dashboard-response.interface.ts
export interface DashboardResponse {
  stats?: {
    dossiers?: Record<string, number>;
    factures?: Record<string, { count: number; montant: number }>;
    clients?: number;
    utilisateurs?: number;
    tachesEnCours?: number;
  };
  chiffreAffaires?: {
    mois: number;
    annee: number;
  };
  dossiersParType?: Record<string, number>;
  performancesAvocats?: any[];
  alertesRecentes?: any[];
  evenementsAvenir?: any[];
  facturesEnAttente?: any[];
  dossiersProchesEcheance?: any[];
  tachesAssignees?: any[];
  dossiersRecentes?: any[];
  facturesRecentes?: any[];
  correspondancesEnAttente?: any[];
  proceduresEnCours?: any[];
  audiencesAvenir?: any[];
  jurisprudencesRecentes?: any[];
  dossiersAssignes?: any[];
  documentsRecentes?: any[];
  alertes?: any[];
}
