import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, motDePasse: string) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const user = await this.prisma.utilisateur.findUnique({ where: { email } });
    if (!user)
      throw new UnauthorizedException('Email ou mot de passe incorrect');

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const passwordValid = await bcrypt.compare(motDePasse, user.motDePasse);
    if (!passwordValid)
      throw new UnauthorizedException('Email ou mot de passe incorrect');

    // Ne retourne pas le mot de passe
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unused-vars
    const { motDePasse: _, ...result } = user;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return result;
  }

  login(user: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  logout(user: any) {
    // Ici tu peux supprimer le refresh token si tu en as un
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return { message: `Utilisateur ${user.email} déconnecté avec succès` };
  }
}
