import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma.service';
import * as bcrypt from 'bcryptjs';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AuthResponse } from './interfaces/auth-response.interface';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private mailService: MailService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    const { email, motDePasse, prenom, nom, role } = registerDto;

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await this.prisma.utilisateur.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Un utilisateur avec cet email existe déjà');
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(motDePasse, 10);

    // Créer l'utilisateur
    const utilisateur = await this.prisma.utilisateur.create({
      data: {
        prenom,
        nom,
        email,
        motDePasse: hashedPassword,
        role: role || 'ASSISTANT',
      },
      select: {
        id: true,
        prenom: true,
        nom: true,
        email: true,
        role: true,
        statut: true,
      },
    });

    // Générer les tokens
    const tokens = this.generateTokens(utilisateur.id, utilisateur.email);

    // Mettre à jour le refresh token dans la base de données
    await this.prisma.utilisateur.update({
      where: { id: utilisateur.id },
      data: { refreshToken: tokens.refreshToken },
    });

    // Envoyer un email de bienvenue
    void this.mailService.sendWelcomeEmail(
      utilisateur.email,
      `${utilisateur.prenom} ${utilisateur.nom}`,
    );

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      utilisateur,
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const { email, motDePasse } = loginDto;

    // Vérifier si l'utilisateur existe
    const utilisateur = await this.prisma.utilisateur.findUnique({
      where: { email },
    });

    if (!utilisateur) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    // Vérifier si l'utilisateur est actif
    if (utilisateur.statut !== 'ACTIF') {
      throw new UnauthorizedException(
        "Votre compte est désactivé. Veuillez contacter l'administrateur",
      );
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(
      motDePasse,
      utilisateur.motDePasse,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    // Générer les tokens
    const tokens = this.generateTokens(utilisateur.id, utilisateur.email);

    // Mettre à jour le refresh token dans la base de données
    await this.prisma.utilisateur.update({
      where: { id: utilisateur.id },
      data: { refreshToken: tokens.refreshToken },
    });

    // Retourner les informations de l'utilisateur sans le mot de passe
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { motDePasse: _, refreshToken: __, ...userInfo } = utilisateur;

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      utilisateur: userInfo,
    };
  }

  async logout(userId: string): Promise<void> {
    // Supprimer le refresh token de la base de données
    await this.prisma.utilisateur.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
  }

  async refreshTokens(refreshToken: string): Promise<AuthResponse> {
    try {
      // Vérifier le refresh token
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('jwt.refreshSecret'),
      });

      // Vérifier si l'utilisateur existe et que le refresh token correspond
      const utilisateur = await this.prisma.utilisateur.findUnique({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        where: { id: payload.sub },
      });

      if (!utilisateur || utilisateur.refreshToken !== refreshToken) {
        throw new UnauthorizedException('Refresh token invalide');
      }

      // Vérifier si l'utilisateur est actif
      if (utilisateur.statut !== 'ACTIF') {
        throw new UnauthorizedException(
          "Votre compte est désactivé. Veuillez contacter l'administrateur",
        );
      }

      // Générer de nouveaux tokens
      const tokens = this.generateTokens(utilisateur.id, utilisateur.email);

      // Mettre à jour le refresh token dans la base de données
      await this.prisma.utilisateur.update({
        where: { id: utilisateur.id },
        data: { refreshToken: tokens.refreshToken },
      });

      // Retourner les informations de l'utilisateur sans le mot de passe
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { motDePasse: _, refreshToken: __, ...userInfo } = utilisateur;

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        utilisateur: userInfo,
      };
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      throw new UnauthorizedException('Refresh token invalide ou expiré');
    }
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<void> {
    const { email } = forgotPasswordDto;

    // Vérifier si l'utilisateur existe
    const utilisateur = await this.prisma.utilisateur.findUnique({
      where: { email },
    });

    if (!utilisateur) {
      // Pour des raisons de sécurité, ne pas révéler si l'email existe ou non
      return;
    }

    // Générer un token de réinitialisation
    const resetToken = this.generateResetToken();
    const resetTokenExpires = new Date();
    resetTokenExpires.setHours(resetTokenExpires.getHours() + 1); // Expire dans 1 heure

    // Mettre à jour l'utilisateur avec le token de réinitialisation
    await this.prisma.utilisateur.update({
      where: { id: utilisateur.id },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordExpires: resetTokenExpires,
      },
    });

    // Envoyer l'email de réinitialisation
    await this.mailService.sendPasswordResetEmail(
      utilisateur.email,
      `${utilisateur.prenom} ${utilisateur.nom}`,
      resetToken,
    );
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<void> {
    const { token, motDePasse } = resetPasswordDto;

    // Vérifier si le token est valide
    const utilisateur = await this.prisma.utilisateur.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: {
          gt: new Date(),
        },
      },
    });

    if (!utilisateur) {
      throw new BadRequestException(
        'Token de réinitialisation invalide ou expiré',
      );
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(motDePasse, 10);

    // Mettre à jour le mot de passe et supprimer le token de réinitialisation
    await this.prisma.utilisateur.update({
      where: { id: utilisateur.id },
      data: {
        motDePasse: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
        refreshToken: null, // Forcer la déconnexion de toutes les sessions
      },
    });

    // Envoyer un email de confirmation
    await this.mailService.sendPasswordResetConfirmationEmail(
      utilisateur.email,
      `${utilisateur.prenom} ${utilisateur.nom}`,
    );
  }

  async changePassword(
    userId: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<void> {
    const { ancienMotDePasse, nouveauMotDePasse } = changePasswordDto;

    // Vérifier si l'utilisateur existe
    const utilisateur = await this.prisma.utilisateur.findUnique({
      where: { id: userId },
    });

    if (!utilisateur) {
      throw new UnauthorizedException('Utilisateur non trouvé');
    }

    // Vérifier l'ancien mot de passe
    const isPasswordValid = await bcrypt.compare(
      ancienMotDePasse,
      utilisateur.motDePasse,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Ancien mot de passe incorrect');
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(nouveauMotDePasse, 10);

    // Mettre à jour le mot de passe
    await this.prisma.utilisateur.update({
      where: { id: userId },
      data: {
        motDePasse: hashedPassword,
        refreshToken: null, // Forcer la déconnexion de toutes les sessions
      },
    });

    // Envoyer un email de confirmation
    await this.mailService.sendPasswordChangeConfirmationEmail(
      utilisateur.email,
      `${utilisateur.prenom} ${utilisateur.nom}`,
    );
  }

  private generateTokens(
    userId: string,
    email: string,
  ): { accessToken: string; refreshToken: string } {
    const payload: JwtPayload = {
      sub: userId,
      email,
      role: '',
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('jwt.refreshSecret'),
      expiresIn: this.configService.get('jwt.refreshExpiresIn'),
    });

    return { accessToken, refreshToken };
  }

  private generateResetToken(): string {
    const chars =
      '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let token = '';
    for (let i = 0; i < 32; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  }
}
