import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RefreshTokenDto } from './dto/refresh-token.dto'; // on créera ce DTO
import { RefreshTokenGuard } from './guards/refresh-token.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const user = await this.authService.validateUser(
      loginDto.email,
      loginDto.motDePasse,
    );
    return this.authService.login(user);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Req() req: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
    return this.authService.logout(req.user);
  }

  // Endpoint pour rafraîchir le token
  @UseGuards(RefreshTokenGuard)
  @Post('refresh')
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken({
      id: dto.userId,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      email: dto.userEmail,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      role: dto.userRole,
    });
  }
}
