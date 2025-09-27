import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class RefreshTokenGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const request = context.switchToHttp().getRequest();

    // Récupère le refresh token depuis le body
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const { refreshToken, userId } = request.body;

    if (!refreshToken || !userId) {
      throw new UnauthorizedException('Refresh token manquant');
    }

    // Récupère l'utilisateur en DB
    const user = await this.prisma.utilisateur.findUnique({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      where: { id: userId },
    });

    if (!user || !user.refreshToken) {
      throw new UnauthorizedException(
        'Utilisateur non trouvé ou token invalide',
      );
    }

    // Vérifie que le token reçu correspond au token stocké
    if (user.refreshToken !== refreshToken) {
      throw new UnauthorizedException('Refresh token invalide');
    }

    try {
      // Vérifie la validité du JWT
      /*const payload = this.jwtService.verify(refreshToken, {
        secret:
          process.env.JWT_SECRET ||
          '51b05d8a692e3d6aa77bd7fdcf74f52278a64b9f6546726d4fbcc487ee05c76859b86b2764e67f4298ed31571af682915af6133fe14dd6a671b0ec2a261d4f31',
      });*/
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      request.user = {
        id: user.id,
        email: user.email,
        role: user.role,
      }; // on passe l'utilisateur décodé au controller
      return true;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      throw new UnauthorizedException('Refresh token expiré ou invalide');
    }
  }
}
