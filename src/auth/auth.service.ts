/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable prettier/prettier */
import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import * as bcrypt from 'bcryptjs';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AuthResponse } from './interfaces/auth-response.interface';
import { PermissionData } from './interfaces/permission.interface';
import { MailService } from '../mail/mail.service';
import { RoleUtilisateur } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private mailService: MailService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  // -------------------- REGISTER --------------------
  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    const { email, motDePasse, prenom, nom, role } = registerDto;

    const existingUser = await this.prisma.utilisateur.findUnique({
      where: { email },
    });
    if (existingUser)
      throw new ConflictException('Un utilisateur avec cet email existe déjà');

    const hashedPassword = await bcrypt.hash(motDePasse, 10);

    const utilisateur = await this.prisma.utilisateur.create({
      data: {
        prenom,
        nom,
        email,
        motDePasse: hashedPassword,
        role: (role as RoleUtilisateur) || 'ASSISTANT',
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

    const tokens = await this.generateTokens(
      utilisateur.id,
      utilisateur.email,
      utilisateur.role,
    );

    const hashedRefreshToken = await bcrypt.hash(tokens.refreshToken, 10);

    await this.prisma.utilisateur.update({
      where: { id: utilisateur.id },
      data: { refreshToken: hashedRefreshToken },
    });

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

  // -------------------- LOGIN --------------------
  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const { email, motDePasse } = loginDto;

    const utilisateur = await this.prisma.utilisateur.findUnique({
      where: { email },
    });

    if (!utilisateur)
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    if (utilisateur.statut !== 'ACTIF')
      throw new UnauthorizedException('Votre compte est désactivé.');

    const isPasswordValid = await bcrypt.compare(
      motDePasse,
      utilisateur.motDePasse,
    );
    if (!isPasswordValid)
      throw new UnauthorizedException('Email ou mot de passe incorrect');

    await this.updateLastLogin(utilisateur.id);

    const tokens = await this.generateTokens(
      utilisateur.id,
      utilisateur.email,
      utilisateur.role,
    );

    const hashedRefreshToken = await bcrypt.hash(tokens.refreshToken, 10);

    await this.prisma.utilisateur.update({
      where: { id: utilisateur.id },
      data: { refreshToken: hashedRefreshToken },
    });

    // Stocker la session dans Redis
    const sessionKey = `session:${utilisateur.id}`;
    await this.cacheManager.set(sessionKey, {
      userId: utilisateur.id,
      email: utilisateur.email,
      role: utilisateur.role,
      loginTime: new Date(),
    }, 7 * 24 * 60 * 60); // 7 jours

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { motDePasse: _, refreshToken: __, ...userInfo } = utilisateur;

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      utilisateur: userInfo,
    };
  }

  async logout(userId: string): Promise<void> {
    await this.prisma.utilisateur.update({
      where: { id: userId },
      data: { refreshToken: null },
    });

    // Supprimer la session de Redis
    const sessionKey = `session:${userId}`;
    await this.cacheManager.del(sessionKey);
  }

  async refreshTokens(refreshToken: string): Promise<AuthResponse> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      const utilisateur = await this.prisma.utilisateur.findUnique({
        where: { id: payload.sub as string },
      });

      if (!utilisateur)
        throw new UnauthorizedException('Refresh token invalide');

      const isMatch = await bcrypt.compare(
        refreshToken,
        utilisateur.refreshToken || '',
      );
      if (!isMatch) throw new UnauthorizedException('Refresh token invalide');

      if (utilisateur.statut !== 'ACTIF')
        throw new UnauthorizedException('Votre compte est désactivé.');

      const tokens = await this.generateTokens(
        utilisateur.id,
        utilisateur.email,
        utilisateur.role,
      );

      const hashedRefreshToken = await bcrypt.hash(tokens.refreshToken, 10);

      await this.prisma.utilisateur.update({
        where: { id: utilisateur.id },
        data: { refreshToken: hashedRefreshToken },
      });

      // Mettre à jour la session dans Redis
      const sessionKey = `session:${utilisateur.id}`;
      await this.cacheManager.set(sessionKey, {
        userId: utilisateur.id,
        email: utilisateur.email,
        role: utilisateur.role,
        loginTime: new Date(),
      }, 7 * 24 * 60 * 60); // 7 jours

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { motDePasse: _, refreshToken: __, ...userInfo } = utilisateur;

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        utilisateur: userInfo,
      };
    } catch {
      throw new UnauthorizedException('Refresh token invalide ou expiré');
    }
  }

  // -------------------- MOT DE PASSE --------------------
  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<void> {
    const { email } = forgotPasswordDto;
    const utilisateur = await this.prisma.utilisateur.findUnique({ where: { email } });
    if (!utilisateur) return;

    const resetToken = this.generateResetToken();
    const resetTokenExpires = new Date();
    resetTokenExpires.setHours(resetTokenExpires.getHours() + 1);

    await this.prisma.utilisateur.update({
      where: { id: utilisateur.id },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordExpires: resetTokenExpires,
      },
    });

    await this.mailService.sendPasswordResetEmail(
      utilisateur.email,
      `${utilisateur.prenom} ${utilisateur.nom}`,
      resetToken,
    );
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<void> {
    const { token, motDePasse } = resetPasswordDto;
    const utilisateur = await this.prisma.utilisateur.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: { gt: new Date() },
      },
    });

    if (!utilisateur)
      throw new BadRequestException(
        'Token de réinitialisation invalide ou expiré',
      );

    const hashedPassword = await bcrypt.hash(motDePasse, 10);

    await this.prisma.utilisateur.update({
      where: { id: utilisateur.id },
      data: {
        motDePasse: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
        refreshToken: null,
      },
    });

    await this.mailService.sendPasswordResetConfirmationEmail(
      utilisateur.email,
      `${utilisateur.prenom} ${utilisateur.nom}`,
    );
  }

  // -------------------- CHANGE PASSWORD --------------------
  async changePassword(
    userId: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<void> {
    const { ancienMotDePasse, nouveauMotDePasse } = changePasswordDto;
    const utilisateur = await this.prisma.utilisateur.findUnique({ where: { id: userId } });
    if (!utilisateur) throw new UnauthorizedException('Utilisateur non trouvé');

    const isPasswordValid = await bcrypt.compare(
      ancienMotDePasse,
      utilisateur.motDePasse,
    );
    if (!isPasswordValid)
      throw new UnauthorizedException('Ancien mot de passe incorrect');

    const hashedPassword = await bcrypt.hash(nouveauMotDePasse, 10);

    await this.prisma.utilisateur.update({
      where: { id: userId },
      data: { motDePasse: hashedPassword, refreshToken: null },
    });

    await this.mailService.sendPasswordChangeConfirmationEmail(
      utilisateur.email,
      `${utilisateur.prenom} ${utilisateur.nom}`,
    );
  }

  // -------------------- MÉTHODE DÉDIÉE POUR LES PERMISSIONS --------------------
  /**
   * Récupère les permissions d'un rôle depuis le cache ou la base de données
   */
  private async getPermissionsForRole(role: RoleUtilisateur): Promise<PermissionData[]> {
    const cacheKey = `permissions:${role}`;
    let permissions = await this.cacheManager.get(cacheKey) as PermissionData[] | null;

    if (!permissions) {
      permissions = await this.prisma.permissionRole.findMany({
        where: { role, statut: 'ACTIF' },
        select: { module: true, lecture: true, ecriture: true, suppression: true },
      });

      // Mettre en cache pour 1 heure
      await this.cacheManager.set(cacheKey, permissions, 3600);
    }

    return permissions;
  }

  /**
   * Convertit les permissions en codes simples pour le JWT
   */
  private convertPermissionsToCodes(permissions: PermissionData[]): string[] {
    const userPermissions: string[] = [];
    for (const p of permissions) {
      if (p.lecture) userPermissions.push(`${p.module}.lecture`);
      if (p.ecriture) userPermissions.push(`${p.module}.ecriture`);
      if (p.suppression) userPermissions.push(`${p.module}.suppression`);
    }
    return userPermissions;
  }

  // -------------------- GENERATE TOKENS --------------------
  private async generateTokens(userId: string, email: string, role: string) {
    // Utiliser la méthode dédiée pour récupérer les permissions
    const permissions = await this.getPermissionsForRole(role as RoleUtilisateur);
    
    // Convertir les permissions en codes simples
    const userPermissions = this.convertPermissionsToCodes(permissions);

    const payload = { sub: userId, email, role, permissions: userPermissions };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: '7d',
    });

    return { accessToken, refreshToken };
  }

  private generateResetToken(): string {
    const chars =
      '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let token = '';
    for (let i = 0; i < 32; i++)
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    return token;
  }

  async updateLastLogin(userId: string) {
    return this.prisma.utilisateur.update({
      where: { id: userId },
      data: { derniereConnexion: new Date() },
      select: { derniereConnexion: true },
    });
  }
}