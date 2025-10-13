import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '../prisma.service';
import { BadRequestException } from '@nestjs/common';
import { CustomReportDto } from './dto/custom-report.dto';
import { TypeDossier } from '@prisma/client'; // ou depuis ton DTO

// Mock de PrismaService
const mockPrisma = {
  dossier: {
    groupBy: jest.fn(),
    count: jest.fn(),
    findMany: jest.fn(),
  },
  tache: {
    groupBy: jest.fn(),
  },
  utilisateur: {
    findMany: jest.fn(),
  },
  facture: {
    findMany: jest.fn(),
  },
};

describe('DashboardService', () => {
  let service: DashboardService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getDossiersStats', () => {
    it('should return correct stats', async () => {
      mockPrisma.dossier.groupBy
        .mockResolvedValueOnce([{ statut: 'OUVERT', _count: { id: 2 } }])
        .mockResolvedValueOnce([{ type: 'IMMOBILIER', _count: { id: 1 } }]);
      mockPrisma.dossier.count.mockResolvedValue(5);

      const result = await service.getDossiersStats();

      expect(result).toEqual({
        parStatut: { OUVERT: 2 },
        parType: { IMMOBILIER: 1 },
        total: 5,
      });
    });

    it('should throw BadRequestException on error', async () => {
      mockPrisma.dossier.groupBy.mockRejectedValue(new Error('fail'));
      await expect(service.getDossiersStats()).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getTasksStats', () => {
    it('should return structured task stats', async () => {
      mockPrisma.tache.groupBy.mockResolvedValue([
        { assigneeId: '1', statut: 'A_FAIRE', _count: { id: 3 } },
      ]);
      mockPrisma.utilisateur.findMany.mockResolvedValue([
        { id: '1', prenom: 'John', nom: 'Doe', email: 'john@test.com' },
      ]);

      const result = await service.getTasksStats();

      expect(result).toEqual([
        {
          user: { id: '1', prenom: 'John', nom: 'Doe', email: 'john@test.com' },
          stats: { A_FAIRE: 3 },
        },
      ]);
    });

    it('should throw BadRequestException on error', async () => {
      mockPrisma.tache.groupBy.mockRejectedValue(new Error('fail'));
      await expect(service.getTasksStats()).rejects.toThrow(
        BadRequestException,
      );
    });
  });
  describe('getCustomReport', () => {
    it('should return dossiers filtered', async () => {
      const filters: CustomReportDto = { type: TypeDossier.IMMOBILIER };
      mockPrisma.dossier.findMany.mockResolvedValue([
        { id: '1', titre: 'Dossier test', client: {}, responsable: {} },
      ]);

      const result = await service.getCustomReport(filters);

      expect(result).toEqual([
        { id: '1', titre: 'Dossier test', client: {}, responsable: {} },
      ]);
      expect(mockPrisma.dossier.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { type: TypeDossier.IMMOBILIER } }),
      );
    });

    it('should throw BadRequestException on error', async () => {
      mockPrisma.dossier.findMany.mockRejectedValue(new Error('fail'));
      await expect(service.getCustomReport({})).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getFinanceReport', () => {
    it('should return finance report correctly', async () => {
      mockPrisma.facture.findMany.mockResolvedValue([
        {
          id: '1',
          montant: 100,
          payee: true,
          statut: 'PAYEE',
          client: {},
          dossier: {},
        },
        {
          id: '2',
          montant: 50,
          payee: false,
          statut: 'BROUILLON',
          client: {},
          dossier: {},
        },
      ]);

      const result = await service.getFinanceReport();

      expect(result.totalFactures).toBe(2);
      expect(result.totalRevenu).toBe(100);
      expect(result.statsParStatut).toEqual({ PAYEE: 1, BROUILLON: 1 });
    });

    it('should throw BadRequestException on error', async () => {
      mockPrisma.facture.findMany.mockRejectedValue(new Error('fail'));
      await expect(service.getFinanceReport()).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
