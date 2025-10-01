import { Test, TestingModule } from '@nestjs/testing';
import { UtilisateursService } from './utilisateurs.service';
import { PrismaService } from '../prisma.service';

describe('UtilisateursService', () => {
  let service: UtilisateursService;
  let prisma: PrismaService;

  const mockPrisma = {
    utilisateur: {
      findMany: jest.fn(),
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
      }),
    );
  });
});
