import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../..//prisma.service';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    configService: ConfigService,
    private prisma: PrismaService,
  ) {
    const refreshSecret = configService.get<string>('jwt.refreshSecret');
    if (!refreshSecret) {
      throw new Error(
        'Le secret JWT de refresh n’est pas défini dans la configuration',
      );
    }

    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
      ignoreExpiration: false,
      secretOrKey: refreshSecret, // ✅ TypeScript est content et sécurité assurée
    });
  }

  async validate(payload: { sub: string; email: string }) {
    const utilisateur = await this.prisma.utilisateur.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        prenom: true,
        nom: true,
        email: true,
        role: true,
        statut: true,
        refreshToken: true,
      },
    });

    if (
      !utilisateur ||
      utilisateur.statut !== 'ACTIF' ||
      !utilisateur.refreshToken
    ) {
      throw new Error('Utilisateur non trouvé, inactif ou sans refresh token');
    }

    return utilisateur;
  }
}
