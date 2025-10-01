import { Test } from '@nestjs/testing';
import { UtilisateursController } from './utilisateurs.controller';
import { UtilisateursService } from './utilisateurs.service';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('UtilisateursController', () => {
  let controller: UtilisateursController;
  //let service: UtilisateursService;

  const mockService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateStatus: jest.fn(),
    softDelete: jest.fn(),
    getTasksByUser: jest.fn(),
    getDossiersByUser: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks(); // ✅ réinitialiser les mocks
    const module = await Test.createTestingModule({
      controllers: [UtilisateursController],
      providers: [{ provide: UtilisateursService, useValue: mockService }],
    }).compile();

    controller = module.get<UtilisateursController>(UtilisateursController);
    //service = module.get<UtilisateursService>(UtilisateursService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ------------------ findAll ------------------
  it('should call service.findAll and return result', async () => {
    const mockResult = [{ id: '1', nom: 'Test' }];
    mockService.findAll.mockResolvedValue(mockResult);

    const result = await controller.findAll({ role: 'ADMIN' });

    expect(mockService.findAll).toHaveBeenCalledWith({ role: 'ADMIN' });
    expect(result).toEqual(mockResult);
  });

  // ------------------ findOne ------------------
  it('should return one user by id', async () => {
    const mockUser = { id: '1', nom: 'Doe', prenom: 'John' };
    mockService.findOne.mockResolvedValue(mockUser);

    const result = await controller.findOne('1');

    expect(mockService.findOne).toHaveBeenCalledWith('1');
    expect(result).toEqual(mockUser);
  });

  it('should throw if service.findOne throws', async () => {
    mockService.findOne.mockRejectedValue(new NotFoundException());
    await expect(controller.findOne('1')).rejects.toThrow(NotFoundException);
  });

  // ------------------ create ------------------
  it('should call service.create and return new user', async () => {
    const dto = {
      prenom: 'Jane',
      nom: 'Doe',
      email: 'jane@example.com',
      motDePasse: 'secret',
    };
    const mockUser = { id: '1', ...dto };
    mockService.create.mockResolvedValue(mockUser);

    const result = await controller.create(dto);

    expect(mockService.create).toHaveBeenCalledWith(dto);
    expect(result).toEqual(mockUser);
  });

  it('should throw ConflictException if service.create throws', async () => {
    const dto = {
      prenom: 'Jane',
      nom: 'Doe',
      email: 'existing@example.com',
      motDePasse: 'secret',
    };
    mockService.create.mockRejectedValue(new ConflictException());
    await expect(controller.create(dto)).rejects.toThrow(ConflictException);
  });

  // ------------------ update ------------------
  it('should call service.update and return updated user', async () => {
    const id = '1';
    const dto = {
      prenom: 'Updated',
      nom: 'User',
      email: 'updated@example.com',
    };
    const mockUser = { id, ...dto };
    mockService.update.mockResolvedValue(mockUser);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const result = await controller.update(id, dto as any);

    expect(mockService.update).toHaveBeenCalledWith(id, dto);
    expect(result).toEqual(mockUser);
  });

  // ------------------ updateStatus ------------------
  it('should call service.updateStatus and return user', async () => {
    const id = '1';
    const dto = { statut: 'ACTIF' as const };
    const mockUser = { id, statut: 'ACTIF' };
    mockService.updateStatus.mockResolvedValue(mockUser);

    const result = await controller.updateStatus(id, dto);

    expect(mockService.updateStatus).toHaveBeenCalledWith(id, dto.statut);
    expect(result).toEqual(mockUser);
  });

  // ------------------ softDelete ------------------
  it('should call service.softDelete and return updated user', async () => {
    const id = '1';
    const mockUser = { id, statut: 'INACTIF' };
    mockService.softDelete.mockResolvedValue(mockUser);

    const result = await controller.softDelete(id);

    expect(mockService.softDelete).toHaveBeenCalledWith(id);
    expect(result).toEqual(mockUser);
  });

  // ------------------ getTasksByUser ------------------
  it('should return tasks for a user', async () => {
    const userId = '1';
    const mockTasks = [{ id: 't1', titre: 'Task 1', dossier: null }];
    mockService.getTasksByUser.mockResolvedValue(mockTasks);

    const result = await controller.getTasksByUser(userId);

    expect(mockService.getTasksByUser).toHaveBeenCalledWith(userId);
    expect(result).toEqual(mockTasks);
  });

  // ------------------ getDossiersByUser ------------------
  it('should return dossiers followed by user', async () => {
    const userId = '1';
    const mockDossiers = [{ id: 'd1', titre: 'Dossier 1' }];
    mockService.getDossiersByUser.mockResolvedValue(mockDossiers);

    const result = await controller.getDossiersByUser(userId);

    expect(mockService.getDossiersByUser).toHaveBeenCalledWith(userId);
    expect(result).toEqual(mockDossiers);
  });
});
