export interface AuditLogData {
  utilisateurId: string;
  action: string;
  typeCible: string;
  cibleId?: string;
  ancienneValeur?: any;
  nouvelleValeur?: any;
}
