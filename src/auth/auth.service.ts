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
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailService: MailService, // injection
  ) {}

  async validateUser(email: string, motDePasse: string) {
    const user = await this.prisma.utilisateur.findUnique({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    const passwordValid = await bcrypt.compare(motDePasse, user.motDePasse);
    if (!passwordValid) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

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
  //forgot password
  async forgotPassword(email: string) {
    const user = await this.prisma.utilisateur.findUnique({ where: { email } });
    if (!user) {
      // toujours renvoyer le même message pour ne pas divulguer l’existence
      return {
        message:
          'Si cet email existe, un message de réinitialisation a été envoyé.',
      };
    }

    const resetToken = this.jwtService.sign(
      { sub: user.id, email: user.email },
      { expiresIn: '15m' },
    );

    await this.prisma.utilisateur.update({
      where: { email },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordExpires: new Date(Date.now() + 15 * 60 * 1000),
      },
    });

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    const html = `
      <h1>Cabinet Juridique XYZ</h1>
      <p>Bonjour ${user.prenom},</p>
      <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
      <p>Cliquez sur ce lien pour réinitialiser votre mot de passe :</p>
      <a href="${resetLink}">${resetLink}</a>
      <p>Ce lien expirera dans 15 minutes.</p>
      <p>Si vous n'avez pas demandé cette réinitialisation, ignorez ce message.</p>
      <p>Merci,<br/>Cabinet Juridix Consulting</p>
    `;

    await this.mailService.sendMail(
      user.email,
      'Réinitialisation de votre mot de passe',
      html,
    );

    return {
      message:
        'Si cet email existe, un message de réinitialisation a été envoyé.',
    };
  }
  // src/auth/auth.service.ts

  async resetPassword(token: string, nouveauMotDePasse: string) {
    try {
      // Vérifie et décode le token
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const payload = this.jwtService.verify(token);

      const user = await this.prisma.utilisateur.findUnique({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        where: { id: payload.sub },
      });

      if (
        !user ||
        user.resetPasswordToken !== token ||
        !user.resetPasswordExpires ||
        user.resetPasswordExpires < new Date()
      ) {
        throw new UnauthorizedException('Lien invalide ou expiré');
      }

      // Hash du nouveau mot de passe
      const hashedPassword = await bcrypt.hash(nouveauMotDePasse, 10);

      await this.prisma.utilisateur.update({
        where: { id: user.id },
        data: {
          motDePasse: hashedPassword,
          resetPasswordToken: null,
          resetPasswordExpires: null,
        },
      });

      return { message: 'Mot de passe réinitialisé avec succès' };
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      throw new UnauthorizedException('Lien invalide ou expiré');
    }
  }
}
