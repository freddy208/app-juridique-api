// src/statistiques/interfaces/statistiques-response.interface.ts
export interface StatistiquesGeneralesResponse {
  periode: string;
  dateDebut: Date;
  dateFin: Date;
  resume: {
    totalDossiers: number;
    totalFactures: number;
    totalFacturesPayees: number;
    totalMontantFactures: number;
    totalMontantFacturesPayees: number;
    totalHonoraires: number;
    totalDepenses: number;
    totalClients: number;
    totalClientsActifs: number;
    totalUtilisateurs: number;
    totalAvocats: number;
    tauxRecouvrement: number;
    margeBeneficiaire: number;
  };
  dossiers: {
    parType: Record<string, number>;
    parStatut: Record<string, number>;
  };
  factures: {
    parStatut: Record<string, { count: number; montant: number }>;
  };
  honoraires: {
    parType: Record<string, { count: number; montant: number }>;
    parStatut: Record<
      string,
      Record<string, { count: number; montant: number }>
    >;
  };
  depenses: {
    parCategorie: Record<string, { count: number; montant: number }>;
  };
  clients: {
    parType: Record<string, Record<string, number>>;
  };
  utilisateurs: {
    parRole: Record<string, Record<string, number>>;
  };
  chiffreAffaires: {
    parMois: Array<{ mois: string; montant: number }>;
  };
  procedures: {
    parType: Record<string, Record<string, number>>;
    parJuridiction: Record<string, number>;
  };
  jurisprudence: {
    parMatiere: Record<string, number>;
    parSensDecision: Record<string, number>;
  };
  performanceAvocats: Array<{
    avocat: {
      id: string;
      prenom: string;
      nom: string;
      specialite: string;
    };
    stats: {
      nombreDossiers: number;
      chiffreAffaires: number;
      tauxVictoire: number;
      delaiMoyen: number;
    };
    performancesParMois: Record<
      string,
      {
        nombreDossiers: number;
        chiffreAffaires: number;
        tauxVictoire: number;
        delaiMoyen: number;
      }
    >;
    performancesHistoriques: Array<{
      id: string;
      avocatId: string;
      mois: Date;
      nombreDossiers: number;
      chiffreAffaires: number;
      tauxVictoire: number;
      delaiMoyen: number;
      satisfactionClient: number;
      creeLe: Date;
    }>;
  }>;
}

export interface PerformanceAvocatsResponse {
  avocat: {
    id: string;
    prenom: string;
    nom: string;
    specialite: string;
    barreau: string;
  };
  stats: {
    nombreDossiers: number;
    chiffreAffaires: number;
    tauxVictoire: number;
    delaiMoyen: number;
  };
  performancesParMois: Record<
    string,
    {
      nombreDossiers: number;
      chiffreAffaires: number;
      tauxVictoire: number;
      delaiMoyen: number;
    }
  >;
  performancesHistoriques: Array<{
    id: string;
    avocatId: string;
    mois: Date;
    nombreDossiers: number;
    chiffreAffaires: number;
    tauxVictoire: number;
    delaiMoyen: number;
    satisfactionClient: number;
    creeLe: Date;
  }>;
}

export interface StatistiquesFinancieresResponse {
  periode: string;
  dateDebut: Date;
  dateFin: Date;
  totaux: {
    factures: number;
    honoraires: number;
    depenses: number;
    paiements: number;
    provisions: number;
    margeBeneficiaire: number;
    tauxRecouvrement: number;
  };
  evolution: {
    facturesParMois: Array<{ mois: string; montant: number; nombre: number }>;
    honorairesParMois: Array<{ mois: string; montant: number; nombre: number }>;
    depensesParMois: Array<{ mois: string; montant: number; nombre: number }>;
    paiementsParMois: Array<{
      mois: string;
      montant: number;
      nombre: number;
      parMode: Record<string, { montant: number; nombre: number }>;
    }>;
    provisionsParMois: Array<{ mois: string; montant: number; nombre: number }>;
  };
  repartition: {
    facturesParStatut: Record<string, { count: number; montant: number }>;
    honorairesParType: Record<string, { count: number; montant: number }>;
    depensesParCategorie: Record<string, { count: number; montant: number }>;
    modePaiement: Record<string, { count: number; montant: number }>;
  };
  recouvrement: {
    parAvocat: Array<{
      avocatId: string;
      nom: string;
      totalFacture: number;
      totalPaye: number;
      tauxRecouvrement: number;
    }>;
    global: number;
  };
}

export interface StatistiquesDossiersResponse {
  periode: string;
  dateDebut: Date;
  dateFin: Date;
  resume: {
    total: number;
    clos: number;
    ouverts: number;
    enCours: number;
    tauxCloture: number;
    dureeMoyenne: number;
  };
  evolution: {
    dossiersParMois: Array<{ mois: string; nombre: number }>;
  };
  repartition: {
    parType: Record<string, number>;
    parStatut: Record<string, number>;
    parAvocat: Array<{
      avocatId: string;
      nom: string;
      total: number;
      clos: number;
      ouverts: number;
      enCours: number;
      tauxClos: number;
    }>;
    parClient: Array<{
      clientId: string;
      nom: string;
      nombre: number;
    }>;
  };
  analyse: {
    dureeMoyenneParType: Record<string, number>;
    valeurFinanciereParType: Record<
      string,
      {
        moyenne: number;
        total: number;
      }
    >;
    risqueParType: Record<string, Record<string, number>>;
  };
  procedures: {
    parType: Record<string, number>;
    parStatut: Record<string, number>;
    delaiMoyenParType: Record<string, number>;
  };
}
