import { Test, TestingModule } from '@nestjs/testing';
import { UtilisateursController } from './utilisateurs.controller';
import { UtilisateursService } from './utilisateurs.service';

describe('UtilisateursController', () => {
  let controller: UtilisateursController;
  let service: UtilisateursService;

  const mockService = {
    findAll: jest.fn().mockResolvedValue([{ id: 1, nom: 'Test' }]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UtilisateursController],
      providers: [{ provide: UtilisateursService, useValue: mockService }],
    }).compile();

    controller = module.get<UtilisateursController>(UtilisateursController);
    service = module.get<UtilisateursService>(UtilisateursService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call service.findAll and return result', async () => {
    const result = await controller.findAll({ role: 'ADMIN' });
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(service.findAll).toHaveBeenCalledWith({ role: 'ADMIN' });
    expect(result).toEqual([{ id: 1, nom: 'Test' }]);
  });
});
