export class TaskResponseDto {
  id: string;
  titre: string;
  description?: string;
  dateLimite?: Date;
  statut: string;
  creeLe: Date;
  modifieLe: Date;
  dossier?: {
    id: string;
    numeroUnique: string;
    titre: string;
    type: string;
  };
  createur: {
    id: string;
    prenom: string;
    nom: string;
  };
}
