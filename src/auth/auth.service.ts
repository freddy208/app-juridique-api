import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, motDePasse: string) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const user = await this.prisma.utilisateur.findUnique({ where: { email } });
    if (!user)
      throw new UnauthorizedException('Email ou mot de passe incorrect');

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
    const passwordValid = await bcrypt.compare(motDePasse, user.motDePasse);
    if (!passwordValid)
      throw new UnauthorizedException('Email ou mot de passe incorrect');

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unused-vars
    const { motDePasse: _, ...result } = user;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return result;
  }

  async login(user: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const payload = { sub: user.id, email: user.email, role: user.role };
    const access_token = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refresh_token = this.jwtService.sign(payload, { expiresIn: '7d' });

    // Stocke le refresh token en DB
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    await this.prisma.utilisateur.update({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      where: { id: user.id },
      data: { refreshToken: refresh_token },
    });

    return { access_token, refresh_token };
  }

  refreshToken(user: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const payload = { sub: user.id, email: user.email, role: user.role };
    const access_token = this.jwtService.sign(payload, { expiresIn: '15m' });
    return { access_token };
  }

  async logout(user: { id: string; email: string }) {
    // Supprime le refresh token de la DB
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    await this.prisma.utilisateur.update({
      where: { id: user.id },
      data: { refreshToken: null },
    });
    return { message: `Utilisateur ${user.id} déconnecté avec succès` };
  }
}
