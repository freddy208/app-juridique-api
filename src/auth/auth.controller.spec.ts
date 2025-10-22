import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Response } from 'express';

describe('AuthController', () => {
  let controller: AuthController;
  let service: Partial<AuthService>;

  beforeEach(async () => {
    service = {
      register: jest.fn(),
      login: jest.fn(),
      logout: jest.fn(),
      refreshTokens: jest.fn(),
      forgotPassword: jest.fn(),
      resetPassword: jest.fn(),
      changePassword: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: service }],
    })
      // Mock du ThrottlerGuard pour éviter les erreurs de dépendances
      .overrideGuard(ThrottlerGuard)
      .useValue({
        canActivate: jest.fn(() => true),
      })
      .compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should return message and user', async () => {
      const mockResponse = { cookie: jest.fn() } as unknown as Response;
      const authResponse = {
        accessToken: 'a',
        refreshToken: 'r',
        utilisateur: { id: '1', email: 'test@test.com' },
      };
      (service.register as jest.Mock).mockResolvedValue(authResponse);

      const result = await controller.register(
        {
          email: 'test@test.com',
          motDePasse: 'pass',
          prenom: 'John',
          nom: 'Doe',
          role: 'ASSISTANT',
        },
        mockResponse,
      );

      expect(result.message).toBe('Inscription réussie');
      expect(result.utilisateur).toEqual(authResponse.utilisateur);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockResponse.cookie).toHaveBeenCalledTimes(2);
    });
  });

  describe('login', () => {
    it('should return message and user', async () => {
      const mockResponse = { cookie: jest.fn() } as unknown as Response;
      const authResponse = {
        accessToken: 'a',
        refreshToken: 'r',
        utilisateur: { id: '1', email: 'test@test.com' },
      };
      (service.login as jest.Mock).mockResolvedValue(authResponse);

      const result = await controller.login(
        { email: 'test@test.com', motDePasse: 'pass' },
        mockResponse,
      );

      expect(result.message).toBe('Connexion réussie');
      expect(result.utilisateur).toEqual(authResponse.utilisateur);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockResponse.cookie).toHaveBeenCalledTimes(2);
    });
  });
});
