// auth.service.ts
import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { RoleUtilisateur as PrismaRoleUtilisateur } from '../../generated/prisma';
import { IUser, IRegisterDto } from './interfaces/user.interface';

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

  async login(user: IUser) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    const access_token = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refresh_token = this.jwtService.sign(payload, { expiresIn: '7d' });

    await this.prisma.utilisateur.update({
      where: { id: user.id },
      data: { refreshToken: refresh_token },
    });

    return { access_token, refresh_token };
  }

  refreshToken(user: IUser) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    const access_token = this.jwtService.sign(payload, { expiresIn: '15m' });
    return { access_token };
  }

  async logout(user: { id: string; email: string }) {
    await this.prisma.utilisateur.update({
      where: { id: user.id },
      data: { refreshToken: null },
    });
    return { message: `Utilisateur ${user.id} déconnecté avec succès` };
  }

  async register(currentUser: IUser, data: IRegisterDto) {
    const allowedRoles: PrismaRoleUtilisateur[] = [
      PrismaRoleUtilisateur.ADMIN,
      PrismaRoleUtilisateur.DG,
      PrismaRoleUtilisateur.AVOCAT,
      PrismaRoleUtilisateur.SECRETAIRE,
    ];
    if (!allowedRoles.includes(currentUser.role)) {
      throw new ForbiddenException(
        "Vous n'avez pas les droits pour créer un utilisateur",
      );
    }

    const existingUser = await this.prisma.utilisateur.findUnique({
      where: { email: data.email },
    });
    if (existingUser) {
      throw new ConflictException('Cet email est déjà utilisé');
    }

    const hashedPassword = await bcrypt.hash(data.motDePasse, 10);

    const user = await this.prisma.utilisateur.create({
      data: {
        prenom: data.prenom,
        nom: data.nom,
        email: data.email,
        motDePasse: hashedPassword,
        role: data.role,
      },
    });

    return this.login(user);
  }
  // auth.service.ts

  async me(userId: string) {
    // On récupère l'utilisateur actuel en base
    const user = await this.prisma.utilisateur.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('Utilisateur non trouvé');
    }

    // On retire le mot de passe avant de renvoyer l'objet
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { motDePasse, refreshToken, ...safeUser } = user;

    return safeUser;
  }
}
