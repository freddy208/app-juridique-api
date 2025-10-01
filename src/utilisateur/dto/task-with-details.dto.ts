export class TaskWithDetailsDto {
  id: string;
  titre: string;
  description: string | null;
  dateLimite: Date | null;
  statut: string;
  creeLe: Date;
  modifieLe: Date;
  dossier?: {
    id: string;
    numeroUnique: string;
    titre: string;
    type: string;
  } | null;
  createur: {
    id: string;
    prenom: string;
    nom: string;
  };
}
