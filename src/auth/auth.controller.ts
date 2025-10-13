import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Get,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

// Interface pour cookie

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Connexion utilisateur avec email et mot de passe' })
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    const user = await this.authService.validateUser(
      loginDto.email,
      loginDto.motDePasse,
    );

    const { access_token, refresh_token } = await this.authService.login(user);

    // Plus de cookie a utiliser
    return { access_token, refresh_token, user };
  }

  @ApiOperation({ summary: 'Déconnexion utilisateur' })
  @Post('logout')
  @Post('logout')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  async logout(@Req() req: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    await this.authService.logout({ id: req.user.id, email: req.user.email });
    return { message: 'Déconnexion réussie' };
  }

  @ApiOperation({ summary: 'Rafraîchir le token JWT' })
  @Post('refresh')
  @Post('refresh')
  async refresh(@Body('refresh_token') refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token manquant');
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const payload = await this.authService.decodeRefreshToken(refreshToken);
    const { access_token } = await this.authService.refreshToken(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
      payload.sub,
      refreshToken,
    );

    return { access_token };
  }

  @ApiOperation({ summary: 'Créer un nouvel utilisateur (admin seulement)' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Post('register')
  async register(@Req() req: any, @Body() dto: RegisterDto) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
    return this.authService.register(req.user, dto);
  }

  @ApiOperation({ summary: 'Récupérer les informations du user connecté' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@Req() req: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
    return this.authService.me(req.user.id);
  }

  @ApiOperation({
    summary: 'Envoyer un email pour réinitialiser le mot de passe',
  })
  @Post('forgot-password')
  async forgotPassword(@Body() body: ForgotPasswordDto) {
    return this.authService.forgotPassword(body.email);
  }

  @ApiOperation({ summary: 'Réinitialiser le mot de passe avec le token' })
  @Post('reset-password')
  async resetPassword(@Body() body: ResetPasswordDto) {
    return this.authService.resetPassword(body.token, body.nouveauMotDePasse);
  }
}
