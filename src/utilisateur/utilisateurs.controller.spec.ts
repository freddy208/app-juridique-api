import { Test, TestingModule } from '@nestjs/testing';
import { UtilisateursController } from './utilisateurs.controller';
import { UtilisateursService } from './utilisateurs.service';

describe('UtilisateursController', () => {
  let controller: UtilisateursController;
  let service: UtilisateursService;

  // ✅ Mock complet avec findAll et findOne
  const mockService: Partial<UtilisateursService> = {
    findAll: jest.fn().mockResolvedValue([{ id: 1, nom: 'Test' }]),
    findOne: jest.fn(),
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

  it('should return one user by id', async () => {
    const mockUser = {
      id: '1',
      nom: 'Doe',
      prenom: 'John',
      email: 'john@example.com',
      role: 'ADMIN',
      statut: 'ACTIF',
      creeLe: new Date(),
      modifieLe: new Date(),
    };
    (mockService.findOne as jest.Mock).mockResolvedValue(mockUser);

    const result = await controller.findOne('1');
    expect(mockService.findOne).toHaveBeenCalledWith('1');
    expect(result).toEqual(mockUser);
  });

  it('should throw if service.findOne throws', async () => {
    (mockService.findOne as jest.Mock).mockRejectedValue(new Error('DB error'));
    await expect(controller.findOne('1')).rejects.toThrow('DB error');
  });
});
