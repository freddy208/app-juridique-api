export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  utilisateur: {
    id: string;
    prenom: string;
    nom: string;
    email: string;
    role: string;
    statut: string;
  };
}
