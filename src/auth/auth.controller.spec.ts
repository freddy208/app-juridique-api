import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../auth/auth.controller';
import { AuthService } from '../auth/auth.service';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import { jwtConstants } from './constants';
//import { RefreshTokenGuard } from '../auth/guards/refresh-token.guard';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockPrisma = {
    utilisateur: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  const mockAuthService = {
    login: jest.fn(),
    validateUser: jest.fn(),
    logout: jest.fn(),
    refreshToken: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AuthService,
        PrismaService,
        RefreshTokenGuard, // <== ajouté
        { provide: AuthService, useValue: mockAuthService },
        { provide: PrismaService, useValue: mockPrisma },
      ],
      imports: [
        JwtModule.register({
          secret: jwtConstants.secret,
          signOptions: { expiresIn: '1h' },
        }),
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService); //
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('login should return access_token and refresh_token', async () => {
    const loginDto = { email: 'test@test.com', motDePasse: '1234' };
    (authService.validateUser as jest.Mock).mockResolvedValue({
      id: '1',
      email: 'test@test.com',
      role: 'ADMIN',
    });

    const result = await controller.login(loginDto);
    expect(result).toEqual({
      access_token: 'fake-access-token',
      refresh_token: 'fake-refresh-token',
    });
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(authService.validateUser).toHaveBeenCalledWith(
      'test@test.com',
      '1234',
    );
  });

  it('logout should return success message', () => {
    (authService.logout as jest.Mock).mockReturnValue({
      message: 'Déconnexion réussie',
    });

    const result = controller.logout({ user: { id: '1' } } as any);
    expect(result).toEqual({ message: 'Déconnexion réussie' });
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(authService.logout).toHaveBeenCalledWith('1');
  });

  it('refresh should return new access_token', () => {
    const mockReq = {
      user: { id: '1', email: 'test@test.com', role: 'ADMIN' },
    };

    (authService.refreshToken as jest.Mock).mockReturnValue({
      access_token: 'new-access-token',
    });

    const result = controller.refresh(mockReq as any);
    expect(result).toEqual({ access_token: 'new-access-token' });
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(authService.refreshToken).toHaveBeenCalledWith({
      id: '1',
      email: 'test@test.com',
      role: 'ADMIN',
    });
  });
});
