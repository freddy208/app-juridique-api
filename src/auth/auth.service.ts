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

    const tokens = this.generateTokens(
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
    // Mettre à jour la dernière connexion
    await this.updateLastLogin(utilisateur.id);

    const tokens = this.generateTokens(
      utilisateur.id,
      utilisateur.email,
      utilisateur.role,
    );
    const hashedRefreshToken = await bcrypt.hash(tokens.refreshToken, 10);

    await this.prisma.utilisateur.update({
      where: { id: utilisateur.id },
      data: { refreshToken: hashedRefreshToken },
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { motDePasse: _, refreshToken: __, ...userInfo } = utilisateur;

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      utilisateur: userInfo,
    };
  }

  async refreshTokens(refreshToken: string): Promise<AuthResponse> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('jwt.refreshSecret'),
      });

      const utilisateur = await this.prisma.utilisateur.findUnique({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        where: { id: payload.sub },
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

      const tokens = this.generateTokens(
        utilisateur.id,
        utilisateur.email,
        utilisateur.role,
      );
      const hashedRefreshToken = await bcrypt.hash(tokens.refreshToken, 10);

      await this.prisma.utilisateur.update({
        where: { id: utilisateur.id },
        data: { refreshToken: hashedRefreshToken },
      });

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

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<void> {
    const { email } = forgotPasswordDto;
    const utilisateur = await this.prisma.utilisateur.findUnique({
      where: { email },
    });
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
  async logout(userId: string): Promise<void> {
    // Supprime le refresh token stocké en base
    await this.prisma.utilisateur.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
  }

  async changePassword(
    userId: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<void> {
    const { ancienMotDePasse, nouveauMotDePasse } = changePasswordDto;
    const utilisateur = await this.prisma.utilisateur.findUnique({
      where: { id: userId },
    });
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

  private generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };
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
