import { AuthService } from './auth.service';
// src/auth/__tests__/auth.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma.service';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: { utilisateur: { findUnique: jest.fn() } },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('fake-jwt-token'),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should validate user successfully', async () => {
    const fakeUser = {
      id: '1',
      email: 'test@test.com',
      motDePasse: await bcrypt.hash('1234', 10),
      role: 'ADMIN',
    };
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    (prisma.utilisateur.findUnique as jest.Mock).mockResolvedValue(fakeUser);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const user = await service.validateUser('test@test.com', '1234');
    expect(user).toHaveProperty('id', '1');
    expect(user).not.toHaveProperty('motDePasse');
  });

  it('should throw UnauthorizedException if wrong password', async () => {
    const fakeUser = {
      id: '1',
      email: 'test@test.com',
      motDePasse: await bcrypt.hash('1234', 10),
      role: 'ADMIN',
    };
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    (prisma.utilisateur.findUnique as jest.Mock).mockResolvedValue(fakeUser);

    await expect(
      service.validateUser('test@test.com', 'wrong'),
    ).rejects.toThrow();
  });

  it('should return access_token on login', () => {
    const user = { id: '1', email: 'test@test.com', role: 'ADMIN' };
    const result = service.login(user);
    expect(result).toEqual({ access_token: 'fake-jwt-token' });
  });
  it('should logout user', () => {
    const result = service.logout({ id: '1', email: 'test@test.com' });
    expect(result).toEqual({ message: 'Utilisateur 1 déconnecté avec succès' });
  });
});
