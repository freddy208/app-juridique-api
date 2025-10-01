import { Test, TestingModule } from '@nestjs/testing';
import { UtilisateursService } from './utilisateurs.service';
import { PrismaService } from '../prisma.service';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('UtilisateursService', () => {
  let service: UtilisateursService;
  let prisma: PrismaService;

  const mockPrisma = {
    utilisateur: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
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

  // ----------- Tests POST /users -----------
  it('should create a new user successfully', async () => {
    const dto = {
      prenom: 'Jane',
      nom: 'Doe',
      email: 'jane@example.com',
      motDePasse: 'secret123',
    };
    mockPrisma.utilisateur.findUnique.mockResolvedValue(null);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    mockPrisma.utilisateur.create.mockImplementation((args) => ({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      ...args.data,
      id: '1',
      creeLe: new Date(),
      modifieLe: new Date(),
    }));

    const result = await service.create(dto);

    expect(mockPrisma.utilisateur.findUnique).toHaveBeenCalledWith({
      where: { email: dto.email },
    });
    expect(mockPrisma.utilisateur.create).toHaveBeenCalledWith(
      expect.objectContaining({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        data: expect.objectContaining({
          prenom: dto.prenom,
          nom: dto.nom,
          email: dto.email,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          motDePasse: expect.any(String), // hashed password
        }),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        select: expect.any(Object),
      }),
    );
    expect(result).toHaveProperty('id', '1');
    expect(result).toHaveProperty('prenom', 'Jane');
  });

  it('should throw ConflictException if email already exists', async () => {
    const dto = {
      prenom: 'Jane',
      nom: 'Doe',
      email: 'existing@example.com',
      motDePasse: 'secret123',
    };
    mockPrisma.utilisateur.findUnique.mockResolvedValue({
      id: '1',
      email: dto.email,
    });
    await expect(service.create(dto)).rejects.toThrow(ConflictException);
  });
  // Ajouter dans ton describe('UtilisateursService', ...)
  it('should update an existing user successfully', async () => {
    const id = '1';
    const dto = {
      prenom: 'Updated',
      nom: 'User',
      email: 'updated@example.com',
      motDePasse: 'newpass123',
    };

    // User existant
    mockPrisma.utilisateur.findUnique
      .mockResolvedValueOnce({ id, email: 'old@example.com' }) // pour vérifier existence
      .mockResolvedValueOnce(null); // pour vérifier conflit email (aucun)

    // Mock update
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    mockPrisma.utilisateur.update.mockImplementation((args) => ({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      ...args.data,
      id,
      creeLe: new Date(),
      modifieLe: new Date(),
    }));

    const result = await service.update(id, dto);

    expect(mockPrisma.utilisateur.findUnique).toHaveBeenCalledWith({
      where: { id },
    });
    expect(mockPrisma.utilisateur.findUnique).toHaveBeenCalledWith({
      where: { email: dto.email },
    });
    expect(mockPrisma.utilisateur.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id },
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        data: expect.objectContaining({
          prenom: dto.prenom,
          nom: dto.nom,
          email: dto.email,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          motDePasse: expect.any(String), // hashed
        }),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        select: expect.any(Object),
      }),
    );
    expect(result).toHaveProperty('id', id);
    expect(result).toHaveProperty('prenom', 'Updated');
  });

  it('should throw NotFoundException if user to update does not exist', async () => {
    mockPrisma.utilisateur.findUnique.mockResolvedValue(null);
    await expect(
      service.update('non-existent-id', { prenom: 'Test' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw ConflictException if new email is already used by another user', async () => {
    const id = '1';
    mockPrisma.utilisateur.findUnique
      .mockResolvedValueOnce({ id, email: 'old@example.com' }) // user exists
      .mockResolvedValueOnce({ id: '2', email: 'existing@example.com' }); // email conflict

    await expect(
      service.update(id, { email: 'existing@example.com' }),
    ).rejects.toThrow(ConflictException);
  });
});
