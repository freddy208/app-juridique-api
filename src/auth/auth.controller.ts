/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Req,
  Res,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { UseGuards as UseThrottlerGuard } from '@nestjs/common';
import { RedisService } from '@/redis/redis.service';

@ApiTags('Authentification')
@Controller('auth')
@UseThrottlerGuard(ThrottlerGuard)
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @Public()
  @ApiOperation({ summary: "Inscription d'un nouvel utilisateur" })
  @ApiResponse({ status: 201, description: 'Utilisateur créé avec succès' })
  @ApiResponse({
    status: 409,
    description: 'Un utilisateur avec cet email existe déjà',
  })
  async register(
    @Body() registerDto: RegisterDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const authResponse = await this.authService.register(registerDto);

    response.cookie('access_token', authResponse.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      maxAge: 3600000, // 1h
      path: '/',
      partitioned: true,
    });

    response.cookie('refresh_token', authResponse.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
      path: '/',
      partitioned: true,
    });

    return {
      message: 'Inscription réussie',
      utilisateur: authResponse.utilisateur,
    };
  }

  @Post('login')
  @Public()
  @ApiOperation({ summary: "Connexion d'un utilisateur" })
  @ApiResponse({ status: 200, description: 'Connexion réussie' })
  @ApiResponse({ status: 401, description: 'Email ou mot de passe incorrect' })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const authResponse = await this.authService.login(loginDto);

    response.cookie('access_token', authResponse.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      maxAge: 3600000,
      path: '/',
      partitioned: true,
    });

    response.cookie('refresh_token', authResponse.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
      partitioned: true,
    });

    return {
      message: 'Connexion réussie',
      utilisateur: authResponse.utilisateur,
    };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Déconnexion d'un utilisateur" })
  @ApiResponse({ status: 200, description: 'Déconnexion réussie' })
  async logout(
    @CurrentUser('id') userId: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.authService.logout(userId);
    response.clearCookie('access_token', {
      path: '/',
      sameSite: 'none',
      secure: process.env.NODE_ENV === 'production',
    });
    response.clearCookie('refresh_token', {
      path: '/',
      sameSite: 'none',
      secure: process.env.NODE_ENV === 'production',
      partitioned: true,
    });

    return { message: 'Déconnexion réussie' };
  }

  @Post('refresh')
  @Public()
  @ApiOperation({ summary: "Rafraîchir les tokens d'accès" })
  @ApiResponse({ status: 200, description: 'Tokens rafraîchis avec succès' })
  @ApiResponse({ status: 401, description: 'Refresh token invalide ou expiré' })
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = request.cookies.refresh_token;

    if (!refreshToken) {
      response.status(HttpStatus.UNAUTHORIZED);
      return { message: 'Refresh token manquant' };
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const authResponse = await this.authService.refreshTokens(refreshToken);

    response.cookie('access_token', authResponse.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      maxAge: 3600000,
      path: '/',
      partitioned: true,
    });

    response.cookie('refresh_token', authResponse.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
      partitioned: true,
    });

    return {
      message: 'Tokens rafraîchis avec succès',
      utilisateur: authResponse.utilisateur,
    };
  }

  @Post('forgot-password')
  @Public()
  @ApiOperation({ summary: 'Demander une réinitialisation de mot de passe' })
  @ApiResponse({ status: 200, description: 'Email de réinitialisation envoyé' })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    await this.authService.forgotPassword(forgotPasswordDto);
    return {
      message:
        'Si cet email existe dans notre système, un email de réinitialisation a été envoyé',
    };
  }

  @Post('reset-password')
  @Public()
  @ApiOperation({ summary: 'Réinitialiser le mot de passe avec un token' })
  @ApiResponse({
    status: 200,
    description: 'Mot de passe réinitialisé avec succès',
  })
  @ApiResponse({
    status: 400,
    description: 'Token de réinitialisation invalide ou expiré',
  })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    await this.authService.resetPassword(resetPasswordDto);
    return { message: 'Mot de passe réinitialisé avec succès' };
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Changer le mot de passe de l'utilisateur connecté",
  })
  @ApiResponse({ status: 200, description: 'Mot de passe changé avec succès' })
  @ApiResponse({ status: 401, description: 'Ancien mot de passe incorrect' })
  async changePassword(
    @CurrentUser('id') userId: string,
    @Body() changePasswordDto: ChangePasswordDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.authService.changePassword(userId, changePasswordDto);
    // Supprimer les cookies pour forcer la reconnexion
    response.clearCookie('access_token', {
      path: '/',
      sameSite: 'none',
      secure: process.env.NODE_ENV === 'production',
      partitioned: true,
    });
    response.clearCookie('refresh_token', {
      path: '/',
      sameSite: 'none',
      secure: process.env.NODE_ENV === 'production',
      partitioned: true,
    });

    return {
      message: 'Mot de passe changé avec succès. Veuillez vous reconnecter.',
    };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Obtenir le profil de l'utilisateur connecté" })
  @ApiResponse({ status: 200, description: 'Profil récupéré avec succès' })
  getProfile(@CurrentUser() utilisateur: any) {
    const responseData = {
      message: 'Profil récupéré avec succès',
      utilisateur,
    };
    console.log(
      '🔥🔥🔥 Réponse à envoyer:',
      JSON.stringify(responseData, null, 2),
    );
    return responseData;
  }
  @Get('test-redis')
  @Public()
  async testRedis(@Inject(RedisService) redisService: RedisService) {
    try {
      await redisService.set(
        'test-key',
        { message: 'Redis fonctionne!', timestamp: new Date() },
        60,
      );
      const result = await redisService.get('test-key');
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}
