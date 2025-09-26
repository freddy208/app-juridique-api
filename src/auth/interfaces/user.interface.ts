import { RoleUtilisateur as PrismaRoleUtilisateur } from '../../../generated/prisma';

export interface IUser {
  id: string;
  email: string;
  role: PrismaRoleUtilisateur;
  motDePasse?: string;
  prenom?: string;
  nom?: string;
}

export interface IRegisterDto {
  prenom: string;
  nom: string;
  email: string;
  motDePasse: string;
  role: PrismaRoleUtilisateur;
}
