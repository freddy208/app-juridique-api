import { Controller, Post, Body, UseGuards, Req, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RefreshTokenGuard } from './guards/refresh-token.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    const user = await this.authService.validateUser(
      loginDto.email,
      loginDto.motDePasse,
    );
    return this.authService.login(user);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Req() req: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
    return this.authService.logout({ id: req.user.sub, email: req.user.email });
  }

  // Endpoint pour rafraîchir le token
  // Endpoint pour rafraîchir le token
  @UseGuards(RefreshTokenGuard)
  @Post('refresh')
  refresh(@Req() req: any) {
    // req.user est injecté automatiquement par le RefreshTokenGuard
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument
    return this.authService.refreshToken(req.user);
  }

  @UseGuards(JwtAuthGuard) // Seuls les connectés peuvent créer
  @Post('register')
  async register(@Req() req, @Body() dto: RegisterDto) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument
    return this.authService.register(req.user, dto);
  }
  // Nouveau endpoint pour récupérer l'utilisateur connecté
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@Req() req: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
    return this.authService.me(req.user.sub); // req.user.sub = id du user (payload JWT)
  }
}
