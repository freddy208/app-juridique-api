import { AuthService } from './auth.service';
// src/auth/__tests__/auth.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

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
});
