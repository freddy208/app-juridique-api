export interface ProcedureResponse {
  id: string;
  dossierId: string;
  typeProcedure: string;
  juridiction: string;
  numeroRG?: string;
  dateIntroduction: Date;
  montantReclame?: number;
  etapeActuelle: string;
  statut: string;
  creeLe: Date;
  modifieLe: Date;
  dossier: {
    id: string;
    numeroUnique: string;
    titre: string;
    type: string;
    statut: string;
  };
  etapes: {
    id: string;
    nom: string;
    description?: string;
    dateDebut: Date;
    dateFin?: Date;
    delaiLegal?: number;
    statut: string;
    responsable?: {
      id: string;
      prenom: string;
      nom: string;
      role: string;
    };
  }[];
  audiences: {
    id: string;
    dateAudience: Date;
    heureAudience: string;
    salle?: string;
    objet: string;
    avocat?: string;
    resultat?: string;
    prochaineDate?: Date;
    statut: string;
  }[];
  pieces: {
    id: string;
    nom: string;
    type: string;
    dateDepot: Date;
    numeroDepot?: string;
    documentUrl: string;
    statut: string;
  }[];
  prochaineEcheance?: Date;
  joursRestants?: number;
  nombreEtapes: number;
  nombreEtapesTerminees: number;
  pourcentageAvancement: number;
}

export interface EtapeProcedureResponse {
  id: string;
  procedureId: string;
  nom: string;
  description?: string;
  dateDebut: Date;
  dateFin?: Date;
  delaiLegal?: number;
  statut: string;
  responsable?: {
    id: string;
    prenom: string;
    nom: string;
    role: string;
  };
  procedure: {
    id: string;
    typeProcedure: string;
    juridiction: string;
    numeroRG?: string;
  };
  joursRestants?: number;
  estEnRetard?: boolean;
  documentsRequis?: {
    id: string;
    nom: string;
    type: string;
    statut: string;
  }[];
}

export interface AudienceResponse {
  id: string;
  procedureId: string;
  dateAudience: Date;
  heureAudience: string;
  salle?: string;
  objet: string;
  avocat?: string;
  resultat?: string;
  prochaineDate?: Date;
  statut: string;
  creeLe: Date;
  modifieLe: Date;
  procedure: {
    id: string;
    typeProcedure: string;
    juridiction: string;
    numeroRG?: string;
    dossier: {
      id: string;
      numeroUnique: string;
      titre: string;
    };
  };
  joursRestants?: number;
  estAujourdhui?: boolean;
  estDemain?: boolean;
  estCetteSemaine?: boolean;
}

export interface PieceJustificativeResponse {
  id: string;
  procedureId: string;
  nom: string;
  type: string;
  dateDepot: Date;
  numeroDepot?: string;
  documentUrl: string;
  statut: string;
  creeLe: Date;
  modifieLe: Date;
  procedure: {
    id: string;
    typeProcedure: string;
    juridiction: string;
    numeroRG?: string;
    dossier: {
      id: string;
      numeroUnique: string;
      titre: string;
    };
  };
  joursDepot?: number;
  estRecent?: boolean;
}

export interface ProcedureStatsResponse {
  totalProcedures: number;
  proceduresEnCours: number;
  proceduresTerminees: number;
  proceduresSuspendues: number;
  audiencesPrevues: number;
  audiencesCetteSemaine: number;
  audiencesEnRetard: number;
  piecesDeposees: number;
  piecesEnAttente: number;
  delaiMoyenProcedure: number;
  proceduresParType: {
    type: string;
    count: number;
  }[];
  proceduresParJuridiction: {
    juridiction: string;
    count: number;
  }[];
  echeancesProches: {
    id: string;
    nom: string;
    dateEcheance: Date;
    joursRestants: number;
    priorite: string;
  }[];
  proceduresRecentes: ProcedureResponse[];
  audiencesProches: AudienceResponse[];
}
