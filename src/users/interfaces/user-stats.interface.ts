export interface UserStats {
  total: number;
  actifs: number;
  inactifs: number;
  suspendus: number;
  parRole: {
    [key: string]: number;
  };
  recentActivity: {
    date: string;
    count: number;
  }[];
}
