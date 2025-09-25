import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../auth/auth.controller';
import { AuthService } from '../auth/auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            validateUser: jest.fn(),
            login: jest
              .fn()
              .mockReturnValue({ access_token: 'fake-jwt-token' }),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('login should return access_token', async () => {
    const loginDto = { email: 'test@test.com', motDePasse: '1234' };
    // Mock validateUser pour qu'il retourne un utilisateur
    (authService.validateUser as jest.Mock).mockResolvedValue({
      id: '1',
      email: 'test@test.com',
      role: 'ADMIN',
    });

    const result = await controller.login(loginDto);
    expect(result).toEqual({ access_token: 'fake-jwt-token' });
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(authService.validateUser).toHaveBeenCalledWith(
      'test@test.com',
      '1234',
    );
  });
});
