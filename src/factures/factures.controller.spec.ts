import { Test, TestingModule } from '@nestjs/testing';
import { FacturesController } from './factures.controller';
import { FacturesService } from './factures.service';
import { StatutFacture } from '@prisma/client';

const mockFacturesService = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  updateStatus: jest.fn(),
  markAsPaid: jest.fn(),
  softDelete: jest.fn(),
};

describe('FacturesController', () => {
  let controller: FacturesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FacturesController],
      providers: [{ provide: FacturesService, useValue: mockFacturesService }],
    }).compile();

    controller = module.get<FacturesController>(FacturesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call service.findAll', async () => {
    const result = { data: [] };
    mockFacturesService.findAll.mockResolvedValue(result);
    expect(await controller.findAll({})).toBe(result);
  });

  it('should call service.findOne', async () => {
    const result = { id: '1' };
    mockFacturesService.findOne.mockResolvedValue(result);
    expect(await controller.findOne('1')).toBe(result);
  });

  it('should call service.create', async () => {
    const dto = {
      clientId: 'c1',
      montant: 100,
      dateEcheance: new Date().toISOString(),
    };
    const result = { id: '1', ...dto };
    mockFacturesService.create.mockResolvedValue(result);
    expect(await controller.create(dto)).toBe(result);
  });

  it('should call service.update', async () => {
    const dto = { montant: 200 };
    const result = { id: '1', ...dto };
    mockFacturesService.update.mockResolvedValue(result);
    expect(await controller.update('1', dto)).toBe(result);
  });

  it('should call service.updateStatus', async () => {
    const dto = { statut: StatutFacture.PAYEE };
    const result = { id: '1', statut: StatutFacture.PAYEE };
    mockFacturesService.updateStatus.mockResolvedValue(result);
    expect(await controller.updateStatus('1', dto)).toBe(result);
  });

  it('should call service.markAsPaid', async () => {
    const result = { id: '1', payee: true };
    mockFacturesService.markAsPaid.mockResolvedValue(result);
    expect(await controller.markAsPaid('1')).toBe(result);
  });

  it('should call service.softDelete', async () => {
    const result = { message: 'supprimée', facture: { id: '1' } };
    mockFacturesService.softDelete.mockResolvedValue(result);
    expect(await controller.softDelete('1')).toBe(result);
  });
});
