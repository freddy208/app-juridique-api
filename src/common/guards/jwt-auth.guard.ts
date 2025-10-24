// src/common/guards/jwt-auth.guard.ts
import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  // ✅ MÉTHODE 1: Gérer les routes publiques
  override canActivate(context: ExecutionContext) {
    // Vérifier si la route a le decorator @Public()
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    // Si route publique, bypass l'authentification
    if (isPublic) {
      return true;
    }

    // Sinon, exécuter la validation JWT normale
    return super.canActivate(context);
  }

  // ✅ MÉTHODE 2: CRITIQUE - Gérer le résultat de validate()
  override handleRequest(err: any, user: any, info: any) {
    console.log('🔍 JwtAuthGuard.handleRequest() appelé');
    console.log('🔍 err:', err);
    console.log('🔍 user:', user);
    console.log('🔍 info:', info);

    // Si erreur ou pas d'utilisateur, rejeter
    if (err || !user) {
      console.error('❌ Authentification échouée');
      throw err || new UnauthorizedException('Non autorisé');
    }

    console.log('✅ Utilisateur authentifié:', user);

    // ✅ IMPORTANT: Retourner l'utilisateur
    // Cet utilisateur sera attaché à request.user
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return user;
  }
}
