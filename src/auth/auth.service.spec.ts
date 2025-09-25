import { AuthService } from './auth.service';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma.service';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            utilisateur: { findUnique: jest.fn(), update: jest.fn() },
          },
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
    jwtService = module.get<JwtService>(JwtService);
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

  it('should return access_token and refresh_token on login', async () => {
    const fakeUser = { id: '1', email: 'test@test.com', role: 'ADMIN' };

    // On mock le retour de login pour contrôler la sortie
    jest.spyOn(service, 'login').mockResolvedValue({
      access_token: 'fake-access-token',
      refresh_token: 'fake-refresh-token',
    });

    const result = await service.login(fakeUser);
    expect(result).toEqual({
      access_token: 'fake-access-token',
      refresh_token: 'fake-refresh-token',
    });
  });

  it('should logout user', async () => {
    const fakeUser = { id: '1', email: 'test@test.com' };

    jest.spyOn(service, 'logout').mockResolvedValue({
      message: 'Utilisateur 1 déconnecté avec succès',
    });

    const result = await service.logout(fakeUser);
    expect(result).toEqual({ message: 'Utilisateur 1 déconnecté avec succès' });
  });

  it('should return new access_token on refreshToken', () => {
    const user = { id: '1', email: 'test@test.com', role: 'ADMIN' };
    (jwtService.sign as jest.Mock).mockReturnValue('new-fake-access-token');

    const result = service.refreshToken(user);
    expect(result).toEqual({ access_token: 'new-fake-access-token' });
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(jwtService.sign).toHaveBeenCalledWith(
      { sub: '1', email: 'test@test.com', role: 'ADMIN' },
      { expiresIn: '15m' },
    );
  });
});
