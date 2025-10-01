import { Test, TestingModule } from '@nestjs/testing';
import { UtilisateursService } from './utilisateurs.service';
import { PrismaService } from '../prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('UtilisateursService', () => {
  let service: UtilisateursService;
  let prisma: PrismaService;

  // ✅ Mock Prisma complet pour findMany et findUnique
  const mockPrisma = {
    utilisateur: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UtilisateursService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<UtilisateursService>(UtilisateursService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should call prisma.utilisateur.findMany with filters', async () => {
    mockPrisma.utilisateur.findMany.mockResolvedValue([]);
    await service.findAll({ role: 'ADMIN', statut: 'ACTIF' });
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(prisma.utilisateur.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { role: 'ADMIN', statut: 'ACTIF' },
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        select: expect.any(Object),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        orderBy: expect.any(Object),
      }),
    );
  });

  it('should return one user by id', async () => {
    const mockUser = {
      id: '1',
      prenom: 'John',
      nom: 'Doe',
      email: 'john@example.com',
      role: 'ADMIN',
      statut: 'ACTIF',
      creeLe: new Date(),
      modifieLe: new Date(),
    };

    mockPrisma.utilisateur.findUnique.mockResolvedValue(mockUser);

    const result = await service.findOne('1');
    expect(result).toEqual(mockUser);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(prisma.utilisateur.findUnique).toHaveBeenCalledWith({
      where: { id: '1' },
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      select: expect.any(Object),
    });
  });

  it('should throw NotFoundException if user not found', async () => {
    mockPrisma.utilisateur.findUnique.mockResolvedValue(null);
    await expect(service.findOne('non-existent-id')).rejects.toThrow(
      NotFoundException,
    );
  });
});
