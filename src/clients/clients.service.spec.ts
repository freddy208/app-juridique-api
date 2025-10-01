// src/clients/clients.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { ClientsService } from './clients.service';
import { PrismaService } from '../prisma.service';
import { FilterClientDto } from './dto/filter-client.dto';
import { StatutClient } from '@prisma/client';

describe('ClientsService', () => {
  let service: ClientsService;
  let prisma: PrismaService;

  const mockPrisma = {
    client: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ClientsService>(ClientsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should call prisma.client.findMany with filters', async () => {
    const filters: FilterClientDto = {
      statut: StatutClient.ACTIF,
      search: 'Jean',
      skip: 0,
      take: 10,
    };

    const mockClients = [
      { id: '1', prenom: 'Jean', nom: 'Dupont', statut: StatutClient.ACTIF },
    ];

    (prisma.client.findMany as jest.Mock).mockResolvedValue(mockClients);

    const result = await service.findAll(filters);

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(prisma.client.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        where: expect.objectContaining({
          statut: StatutClient.ACTIF,
          OR: [
            { prenom: { contains: 'Jean', mode: 'insensitive' } },
            { nom: { contains: 'Jean', mode: 'insensitive' } },
          ],
        }),
        skip: 0,
        take: 10,
      }),
    );
    expect(result).toEqual(mockClients);
  });

  it('should handle empty filters', async () => {
    const filters: FilterClientDto = {};
    (prisma.client.findMany as jest.Mock).mockResolvedValue([]);

    const result = await service.findAll(filters);

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(prisma.client.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {},
      }),
    );
    expect(result).toEqual([]);
  });
});
