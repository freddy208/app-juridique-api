import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../auth/auth.controller';
import { AuthService } from '../auth/auth.service';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import { jwtConstants } from './constants';
import { RegisterDto } from './dto/register.dto';
import { RoleUtilisateur } from '../enums/role-utilisateur.enum';
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
    register: jest.fn(),
    me: jest.fn(),
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
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

    (authService.login as jest.Mock).mockResolvedValue({
      access_token: 'fake-access-token',
      refresh_token: 'fake-refresh-token',
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
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(authService.login).toHaveBeenCalledWith({
      id: '1',
      email: 'test@test.com',
      role: 'ADMIN',
    });
  });

  it('logout should return success message', async () => {
    (authService.logout as jest.Mock).mockResolvedValue({
      message: 'Déconnexion réussie',
    });

    const mockReq = {
      user: { id: '1', email: 'test@test.com' },
    };

    const result = await controller.logout(mockReq as any);

    expect(result).toEqual({ message: 'Déconnexion réussie' });
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(authService.logout).toHaveBeenCalledWith({
      id: '1',
      email: 'test@test.com',
    });
  });

  it('refresh should return new access_token', async () => {
    const body = { userId: '1', refreshToken: 'valid-refresh-token' };

    (authService.refreshToken as jest.Mock).mockResolvedValue({
      access_token: 'new-access-token',
    });

    const result = await controller.refresh(body);

    expect(result).toEqual({ access_token: 'new-access-token' });
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(authService.refreshToken).toHaveBeenCalledWith(
      '1',
      'valid-refresh-token',
    );
  });

  it('register should create a new user and return tokens', async () => {
    const registerDto: RegisterDto = {
      prenom: 'Jean',
      nom: 'Dupont',
      email: 'new@test.com',
      motDePasse: '123456',
      role: RoleUtilisateur.ADMIN, // ou RoleUtilisateur.USER selon ton enum
    };

    const fakeReq = { user: { id: 'creator-1', email: 'admin@test.com' } };

    (authService.register as jest.Mock).mockResolvedValue({
      access_token: 'new-access-token',
      refresh_token: 'new-refresh-token',
    });

    const result = await controller.register(fakeReq as any, registerDto);

    expect(result).toEqual({
      access_token: 'new-access-token',
      refresh_token: 'new-refresh-token',
    });
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(authService.register).toHaveBeenCalledWith(
      fakeReq.user,
      registerDto,
    );
  });
  it('me should return the current logged user info', async () => {
    const fakeReq = {
      user: { id: '1', email: 'user@test.com', role: 'ADMIN' },
    };

    (authService.me as jest.Mock).mockResolvedValue({
      id: '1',
      email: 'user@test.com',
      prenom: 'John',
      nom: 'Doe',
      role: 'ADMIN',
    });

    const result = await controller.me(fakeReq as any);

    expect(result).toEqual({
      id: '1',
      email: 'user@test.com',
      prenom: 'John',
      nom: 'Doe',
      role: 'ADMIN',
    });

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(authService.me).toHaveBeenCalledWith('1'); // req.user.id
  });

  //forgot password
  it('forgotPassword should call service and return message', async () => {
    const body = { email: 'user@test.com' };

    (authService.forgotPassword as jest.Mock).mockResolvedValue({
      message:
        'Si cet email existe, un message de réinitialisation a été envoyé.',
    });

    const result = await controller.forgotPassword(body);

    expect(result).toEqual({
      message:
        'Si cet email existe, un message de réinitialisation a été envoyé.',
    });
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(authService.forgotPassword).toHaveBeenCalledWith('user@test.com');
  });
  it('resetPassword should call service and return message', async () => {
    const body = { token: 'valid-token', nouveauMotDePasse: 'new-password' };

    (authService.resetPassword as jest.Mock).mockResolvedValue({
      message: 'Mot de passe réinitialisé avec succès',
    });

    const result = await controller.resetPassword(body);

    expect(result).toEqual({
      message: 'Mot de passe réinitialisé avec succès',
    });
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(authService.resetPassword).toHaveBeenCalledWith(
      'valid-token',
      'new-password',
    );
  });
});
