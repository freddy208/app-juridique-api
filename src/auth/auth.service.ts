import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { RoleUtilisateur } from '../enums/role-utilisateur.enum';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, motDePasse: string) {
    const user = await this.prisma.utilisateur.findUnique({ where: { email } });
    if (!user)
      throw new UnauthorizedException('Email ou mot de passe incorrect');

    const passwordValid = await bcrypt.compare(motDePasse, user.motDePasse);
    if (!passwordValid)
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { motDePasse: _, ...result } = user;
    return result;
  }

  async login(user: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const payload = { sub: user.id, email: user.email, role: user.role };
    const access_token = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refresh_token = this.jwtService.sign(payload, { expiresIn: '7d' });

    // Stocke le refresh token en DB
    await this.prisma.utilisateur.update({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      where: { id: user.id },
      data: { refreshToken: refresh_token },
    });

    return { access_token, refresh_token };
  }

  refreshToken(user: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const payload = { sub: user.sub, email: user.email, role: user.role };
    const access_token = this.jwtService.sign(payload, { expiresIn: '15m' });
    return { access_token };
  }

  async logout(user: { id: string; email: string }) {
    // Supprime le refresh token de la DB
    await this.prisma.utilisateur.update({
      where: { id: user.id },
      data: { refreshToken: null },
    });
    return { message: `Utilisateur ${user.id} déconnecté avec succès` };
  }
  //Methode pour enregistrer un utilisateur
  async register(
    currentUser: any,
    data: {
      prenom: string;
      nom: string;
      email: string;
      motDePasse: string;
      role: RoleUtilisateur;
    },
  ) {
    // Vérifie que l'utilisateur connecté a le droit
    const allowedRoles: RoleUtilisateur[] = [
      RoleUtilisateur.ADMIN,
      RoleUtilisateur.DG,
      RoleUtilisateur.AVOCAT,
      RoleUtilisateur.SECRETAIRE,
    ];

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
    if (!allowedRoles.includes(currentUser.role)) {
      throw new ForbiddenException(
        'Vous n’avez pas les droits pour créer un utilisateur',
      );
    }

    // Vérifie si l’email existe déjà
    const existingUser = await this.prisma.utilisateur.findUnique({
      where: { email: data.email },
    });
    if (existingUser) {
      throw new UnauthorizedException('Cet email est déjà utilisé');
    }

    // Hash du mot de passe
    const hashedPassword = await bcrypt.hash(data.motDePasse, 10);

    // Création en DB
    const user = await this.prisma.utilisateur.create({
      data: {
        prenom: data.prenom,
        nom: data.nom,
        email: data.email,
        motDePasse: hashedPassword,
        role: data.role,
      },
    });

    // On ne retourne pas le mot de passe
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { motDePasse, ...result } = user;
    return result;
  }
}
