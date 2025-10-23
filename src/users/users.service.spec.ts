import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma.service';
import * as bcrypt from 'bcryptjs';

jest.mock('bcryptjs');

describe('UsersService', () => {
  let service: UsersService;
  let prisma: any; // <== ou typé correctement selon la solution choisie

  beforeEach(async () => {
    const prismaMock = {
      utilisateur: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        findMany: jest.fn(),
        updateMany: jest.fn(),
        count: jest.fn(),
        groupBy: jest.fn(),
      },
      journalAudit: { create: jest.fn() },
      dossier: { count: jest.fn() },
      honoraire: { aggregate: jest.fn() },
      satisfaction: { aggregate: jest.fn() },
      $queryRawUnsafe: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    prisma = module.get(PrismaService);
  });

  it('devrait créer un utilisateur si email non existant', async () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    (prisma.utilisateur.findUnique as jest.Mock).mockResolvedValue(null);
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    (prisma.utilisateur.create as jest.Mock).mockResolvedValue({
      id: '1',
      email: 'test@test.com',
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const result = await service.create({
      email: 'test@test.com',
      motDePasse: '123456',
      prenom: 'John',
      nom: 'Doe',
    } as any);

    expect(result).toEqual({ id: '1', email: 'test@test.com' });
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(prisma.utilisateur.create).toHaveBeenCalled();
  });
});
