import { Test, TestingModule } from '@nestjs/testing';
import { UtilisateursController } from './utilisateurs.controller';
import { UtilisateursService } from './utilisateurs.service';
import { ConflictException } from '@nestjs/common';

describe('UtilisateursController', () => {
  let controller: UtilisateursController;
  let service: UtilisateursService;

  const mockService: Partial<UtilisateursService> = {
    findAll: jest.fn().mockResolvedValue([{ id: 1, nom: 'Test' }]),
    findOne: jest.fn(),
    create: jest.fn(),
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

  // ----------- Tests POST /users -----------
  it('should call service.create and return new user', async () => {
    const dto = {
      prenom: 'Jane',
      nom: 'Doe',
      email: 'jane@example.com',
      motDePasse: 'secret123',
    };
    const mockUser = {
      id: '1',
      prenom: 'Jane',
      nom: 'Doe',
      email: 'jane@example.com',
      role: 'ASSISTANT',
      statut: 'ACTIF',
      creeLe: new Date(),
      modifieLe: new Date(),
    };
    (mockService.create as jest.Mock).mockResolvedValue(mockUser);

    const result = await controller.create(dto);
    expect(mockService.create).toHaveBeenCalledWith(dto);
    expect(result).toEqual(mockUser);
  });

  it('should throw ConflictException if email already exists', async () => {
    const dto = {
      prenom: 'Jane',
      nom: 'Doe',
      email: 'existing@example.com',
      motDePasse: 'secret123',
    };
    (mockService.create as jest.Mock).mockRejectedValue(
      new ConflictException('Email déjà utilisé'),
    );

    await expect(controller.create(dto)).rejects.toThrow(ConflictException);
  });
});
