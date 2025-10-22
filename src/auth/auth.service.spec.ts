import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MailService } from '../mail/mail.service';
import * as bcrypt from 'bcryptjs';
import {
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: Partial<Record<keyof PrismaService, any>>;
  let jwtService: Partial<JwtService>;
  let configService: Partial<ConfigService>;
  let mailService: Partial<MailService>;

  beforeEach(async () => {
    // Mock complet de PrismaService pour éviter les erreurs TS
    prisma = {
      utilisateur: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
        createMany: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        findFirstOrThrow: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
        updateMany: jest.fn(),
      },
    } as unknown as PrismaService;

    jwtService = {
      sign: jest.fn().mockReturnValue('token'),
      verify: jest.fn(),
    };

    configService = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'jwt.refreshSecret') return 'refresh-secret';
        if (key === 'jwt.refreshExpiresIn') return '7d';
        return null;
      }),
    };

    mailService = {
      sendWelcomeEmail: jest.fn(),
      sendPasswordResetEmail: jest.fn(),
      sendPasswordResetConfirmationEmail: jest.fn(),
      sendPasswordChangeConfirmationEmail: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
        { provide: MailService, useValue: mailService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ---------- REGISTER ----------
  describe('register', () => {
    it('should throw ConflictException if user exists', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      (prisma.utilisateur.findUnique as jest.Mock).mockResolvedValue({
        email: 'test@test.com',
      });

      await expect(
        service.register({
          email: 'test@test.com',
          motDePasse: 'pass',
          prenom: 'John',
          nom: 'Doe',
          role: 'ASSISTANT',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should create user and return tokens', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      (prisma.utilisateur.findUnique as jest.Mock).mockResolvedValue(null);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      (prisma.utilisateur.create as jest.Mock).mockResolvedValue({
        id: '1',
        prenom: 'John',
        nom: 'Doe',
        email: 'test@test.com',
        role: 'ASSISTANT',
        statut: 'ACTIF',
      });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      (prisma.utilisateur.update as jest.Mock).mockResolvedValue(true);

      const result = await service.register({
        email: 'test@test.com',
        motDePasse: 'pass',
        prenom: 'John',
        nom: 'Doe',
        role: 'ASSISTANT',
      });

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(mailService.sendWelcomeEmail).toHaveBeenCalled();
    });
  });

  // ---------- LOGIN ----------
  describe('login', () => {
    it('should throw UnauthorizedException if user not found', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      (prisma.utilisateur.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(
        service.login({ email: 'test@test.com', motDePasse: 'pass' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password invalid', async () => {
      const hashed = await bcrypt.hash('correct', 10);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      (prisma.utilisateur.findUnique as jest.Mock).mockResolvedValue({
        motDePasse: hashed,
        statut: 'ACTIF',
        id: '1',
        email: 'test@test.com',
        prenom: 'John',
        nom: 'Doe',
        role: 'ASSISTANT',
      });

      await expect(
        service.login({ email: 'test@test.com', motDePasse: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return tokens if valid', async () => {
      const hashed = await bcrypt.hash('pass', 10);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      (prisma.utilisateur.findUnique as jest.Mock).mockResolvedValue({
        motDePasse: hashed,
        statut: 'ACTIF',
        id: '1',
        email: 'test@test.com',
        prenom: 'John',
        nom: 'Doe',
        role: 'ASSISTANT',
      });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      (prisma.utilisateur.update as jest.Mock).mockResolvedValue(true);

      const result = await service.login({
        email: 'test@test.com',
        motDePasse: 'pass',
      });

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });
  });

  // ---------- LOGOUT ----------
  describe('logout', () => {
    it('should remove refresh token', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      (prisma.utilisateur.update as jest.Mock).mockResolvedValue(true);

      await service.logout('1');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(prisma.utilisateur.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { refreshToken: null },
      });
    });
  });

  // ---------- FORGOT PASSWORD ----------
  describe('forgotPassword', () => {
    it('should call mailService if user exists', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      (prisma.utilisateur.findUnique as jest.Mock).mockResolvedValue({
        id: '1',
        email: 'test@test.com',
        prenom: 'John',
        nom: 'Doe',
      });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      (prisma.utilisateur.update as jest.Mock).mockResolvedValue(true);

      await service.forgotPassword({ email: 'test@test.com' });
      expect(mailService.sendPasswordResetEmail).toHaveBeenCalled();
    });

    it('should do nothing if user not exists', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      (prisma.utilisateur.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(
        service.forgotPassword({ email: 'unknown@test.com' }),
      ).resolves.toBeUndefined();
    });
  });

  // ---------- RESET PASSWORD ----------
  describe('resetPassword', () => {
    it('should throw BadRequestException if token invalid', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      (prisma.utilisateur.findFirst as jest.Mock).mockResolvedValue(null);
      await expect(
        service.resetPassword({ token: 'token', motDePasse: 'newpass' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reset password if token valid', async () => {
      const user = {
        id: '1',
        email: 'test@test.com',
        prenom: 'John',
        nom: 'Doe',
      };
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      (prisma.utilisateur.findFirst as jest.Mock).mockResolvedValue(user);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      (prisma.utilisateur.update as jest.Mock).mockResolvedValue(true);

      await service.resetPassword({ token: 'token', motDePasse: 'newpass' });
      expect(mailService.sendPasswordResetConfirmationEmail).toHaveBeenCalled();
    });
  });

  // ---------- CHANGE PASSWORD ----------
  describe('changePassword', () => {
    it('should throw UnauthorizedException if user not found', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      (prisma.utilisateur.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(
        service.changePassword('1', {
          ancienMotDePasse: 'old',
          nouveauMotDePasse: 'new',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if old password invalid', async () => {
      const hashed = await bcrypt.hash('correct', 10);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      (prisma.utilisateur.findUnique as jest.Mock).mockResolvedValue({
        motDePasse: hashed,
      });
      await expect(
        service.changePassword('1', {
          ancienMotDePasse: 'wrong',
          nouveauMotDePasse: 'new',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should change password if old password valid', async () => {
      const hashed = await bcrypt.hash('old', 10);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      (prisma.utilisateur.findUnique as jest.Mock).mockResolvedValue({
        motDePasse: hashed,
        email: 'test@test.com',
        prenom: 'John',
        nom: 'Doe',
      });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      (prisma.utilisateur.update as jest.Mock).mockResolvedValue(true);

      await service.changePassword('1', {
        ancienMotDePasse: 'old',
        nouveauMotDePasse: 'new',
      });
      expect(
        mailService.sendPasswordChangeConfirmationEmail,
      ).toHaveBeenCalled();
    });
  });
});
