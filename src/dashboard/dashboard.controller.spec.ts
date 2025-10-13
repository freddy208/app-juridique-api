import { Test, TestingModule } from '@nestjs/testing';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

const mockDashboardService = {
  getDossiersStats: jest.fn(),
  getTasksStats: jest.fn(),
  getCustomReport: jest.fn(),
  getFinanceReport: jest.fn(),
};

describe('DashboardController', () => {
  let controller: DashboardController;
  let service: DashboardService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [
        { provide: DashboardService, useValue: mockDashboardService },
      ],
    }).compile();

    controller = module.get<DashboardController>(DashboardController);
    service = module.get<DashboardService>(DashboardService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call getDossiersStats', async () => {
    const mockResult = { total: 1, parStatut: {}, parType: {} };
    mockDashboardService.getDossiersStats.mockResolvedValue(mockResult);

    const result = await controller.getDossiersStats();
    expect(result).toEqual(mockResult);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(service.getDossiersStats).toHaveBeenCalled();
  });

  it('should call getTasksStats', async () => {
    const mockResult = [];
    mockDashboardService.getTasksStats.mockResolvedValue(mockResult);

    const result = await controller.getTasksStats();
    expect(result).toEqual(mockResult);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(service.getTasksStats).toHaveBeenCalled();
  });

  it('should call getCustomReport', async () => {
    const filters = { type: 'IMMOBILIER' };
    const mockResult = [{ id: '1' }];
    mockDashboardService.getCustomReport.mockResolvedValue(mockResult);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const result = await controller.getCustomReport(filters as any);
    expect(result).toEqual(mockResult);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(service.getCustomReport).toHaveBeenCalledWith(filters);
  });

  it('should call getFinanceReport', async () => {
    const query = { clientId: '1', start: '2025-01-01', end: '2025-12-31' };
    const mockResult = {
      totalFactures: 2,
      totalRevenu: 100,
      statsParStatut: {},
      factures: [],
    };
    mockDashboardService.getFinanceReport.mockResolvedValue(mockResult);

    const result = await controller.getFinanceReport(
      query.clientId,
      query.start,
      query.end,
    );
    expect(result).toEqual(mockResult);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(service.getFinanceReport).toHaveBeenCalledWith(query);
  });
});
