/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const jwtSecret = configService.get<string>('jwt.secret');
    if (!jwtSecret) {
      throw new Error("Le secret JWT n'est pas défini dans la configuration");
    }

    super({
      // ✅ MODIFICATION ICI : Extraire depuis les cookies
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          // Extraire depuis le cookie 'access_token'
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return
          return request?.cookies?.access_token;
        },
        // Fallback : extraire depuis le header Authorization (optionnel)
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: any) {
    const utilisateur = await this.prisma.utilisateur.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        prenom: true,
        nom: true,
        email: true,
        role: true,
        statut: true,
      },
    });

    if (!utilisateur) throw new UnauthorizedException();

    // Fusionner les infos utilisateur + permissions du payload
    return {
      ...utilisateur,
      permissions: payload.permissions || [],
    };
  }
}
