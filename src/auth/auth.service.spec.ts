import { AuthService } from './auth.service';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma.service';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, ForbiddenException } from '@nestjs/common';
import { RoleUtilisateur } from '../enums/role-utilisateur.enum';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let jwtService: JwtService;

  const adminUser = {
    id: 'admin-1',
    email: 'admin@test.com',
    role: RoleUtilisateur.ADMIN,
  };
  const newUserData = {
    prenom: 'John',
    nom: 'Doe',
    email: 'new@test.com',
    motDePasse: '123456',
    role: RoleUtilisateur.STAGIAIRE,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            utilisateur: {
              findUnique: jest.fn(),
              update: jest.fn(),
              create: jest.fn(),
            },
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
      role: RoleUtilisateur.ADMIN,
    };
    (prisma.utilisateur.findUnique as jest.Mock).mockResolvedValue(fakeUser);

    const user = await service.validateUser('test@test.com', '1234');
    expect(user).toHaveProperty('id', '1');
    expect(user).not.toHaveProperty('motDePasse');
  });

  it('should throw UnauthorizedException if wrong password', async () => {
    const fakeUser = {
      id: '1',
      email: 'test@test.com',
      motDePasse: await bcrypt.hash('1234', 10),
      role: RoleUtilisateur.ADMIN,
    };
    (prisma.utilisateur.findUnique as jest.Mock).mockResolvedValue(fakeUser);

    await expect(
      service.validateUser('test@test.com', 'wrong'),
    ).rejects.toThrow();
  });

  it('should return access_token and refresh_token on login', async () => {
    const fakeUser = {
      id: '1',
      email: 'test@test.com',
      role: RoleUtilisateur.ADMIN,
    };

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
    const user = {
      id: '1',
      email: 'test@test.com',
      role: RoleUtilisateur.ADMIN,
    };
    (jwtService.sign as jest.Mock).mockReturnValue('new-fake-access-token');

    const result = service.refreshToken(user);
    expect(result).toEqual({ access_token: 'new-fake-access-token' });
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(jwtService.sign).toHaveBeenCalledWith(
      { sub: '1', email: 'test@test.com', role: RoleUtilisateur.ADMIN },
      { expiresIn: '15m' },
    );
  });

  it('should throw ConflictException if user already exists', async () => {
    (prisma.utilisateur.findUnique as jest.Mock).mockResolvedValue({
      id: '2',
      email: 'new@test.com',
    });

    await expect(service.register(adminUser, newUserData)).rejects.toThrow(
      ConflictException,
    );
  });

  it('should throw ForbiddenException if currentUser role is not allowed', async () => {
    const nonAdminUser = {
      id: 'user-1',
      email: 'user@test.com',
      role: RoleUtilisateur.STAGIAIRE,
    };
    (prisma.utilisateur.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(service.register(nonAdminUser, newUserData)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('should create user and return tokens', async () => {
    (prisma.utilisateur.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.utilisateur.create as jest.Mock).mockResolvedValue({
      id: '3',
      ...newUserData,
      motDePasse: 'hashed-password',
    });

    jest.spyOn(service, 'login').mockResolvedValue({
      access_token: 'new-access-token',
      refresh_token: 'new-refresh-token',
    });

    const result = await service.register(adminUser, newUserData);

    expect(result).toEqual({
      access_token: 'new-access-token',
      refresh_token: 'new-refresh-token',
    });

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(prisma.utilisateur.create).toHaveBeenCalledWith({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      data: expect.objectContaining({
        prenom: 'John',
        nom: 'Doe',
        email: 'new@test.com',
        role: RoleUtilisateur.STAGIAIRE,
      }),
    });
  });
});
