import { Test, TestingModule } from '@nestjs/testing';
import { UtilisateursController } from './utilisateurs.controller';
import { UtilisateursService } from './utilisateurs.service';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('UtilisateursController', () => {
  let controller: UtilisateursController;
  let service: UtilisateursService;

  type MockUtilisateurService = {
    getTasksByUser: jest.Mock;
    findAll: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    update: jest.Mock; // ici c’est correct
    updateStatus: jest.Mock;
    softDelete: jest.Mock;
  };
  const mockService: MockUtilisateurService = {
    findAll: jest.fn().mockResolvedValue([{ id: 1, nom: 'Test' }]),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateStatus: jest.fn(),
    softDelete: jest.fn(),
    getTasksByUser: jest.fn(),
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
    mockService.findOne.mockResolvedValue(mockUser);
    const result = await controller.findOne('1');
    expect(mockService.findOne).toHaveBeenCalledWith('1');
    expect(result).toEqual(mockUser);
  });

  it('should throw if service.findOne throws', async () => {
    mockService.findOne.mockRejectedValue(new Error('DB error'));
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
    mockService.create.mockResolvedValue(mockUser);

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
    mockService.create.mockRejectedValue(
      new ConflictException('Email déjà utilisé'),
    );

    await expect(controller.create(dto)).rejects.toThrow(ConflictException);
  });
  // Ajouter dans ton describe('UtilisateursController', ...)
  it('should call service.update and return updated user', async () => {
    const id = '1';
    const dto = {
      prenom: 'Updated',
      nom: 'User',
      email: 'updated@example.com',
    };
    const mockUser = {
      id,
      prenom: 'Updated',
      nom: 'User',
      email: 'updated@example.com',
      role: 'ASSISTANT',
      statut: 'ACTIF',
      creeLe: new Date(),
      modifieLe: new Date(),
    };

    mockService.update.mockResolvedValue(mockUser);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const result = await controller.update(id, dto as any);
    expect(mockService.update).toHaveBeenCalledWith(id, dto);
    expect(result).toEqual(mockUser);
  });

  it('should throw ConflictException if service.update throws it', async () => {
    const id = '1';
    const dto = { email: 'existing@example.com' };
    mockService.update.mockRejectedValue(
      new ConflictException('Email déjà utilisé'),
    );

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    await expect(controller.update(id, dto as any)).rejects.toThrow(
      ConflictException,
    );
  });
  describe('PATCH /users/:id/status', () => {
    const id = '1';
    const dto = { statut: 'ACTIF' as const };
    const mockUser = {
      id,
      prenom: 'John',
      nom: 'Doe',
      email: 'john@example.com',
      role: 'ASSISTANT',
      statut: 'ACTIF',
      creeLe: new Date(),
      modifieLe: new Date(),
    };

    it('should call service.updateStatus and return updated user', async () => {
      mockService.updateStatus = jest.fn().mockResolvedValue(mockUser);

      const result = await controller.updateStatus(id, dto);
      expect(mockService.updateStatus).toHaveBeenCalledWith(id, dto.statut);
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException if service.updateStatus throws it', async () => {
      mockService.updateStatus = jest
        .fn()
        .mockRejectedValue(new NotFoundException());
      await expect(controller.updateStatus(id, dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException if service.updateStatus throws it', async () => {
      mockService.updateStatus = jest
        .fn()
        .mockRejectedValue(new ConflictException());
      await expect(controller.updateStatus(id, dto)).rejects.toThrow(
        ConflictException,
      );
    });
  });
  describe('DELETE /users/:id', () => {
    const id = '1';
    const mockUser = {
      id,
      prenom: 'John',
      nom: 'Doe',
      email: 'john@example.com',
      role: 'ASSISTANT',
      statut: 'INACTIF',
      creeLe: new Date(),
      modifieLe: new Date(),
    };

    it('should call service.softDelete and return updated user', async () => {
      mockService.softDelete = jest.fn().mockResolvedValue(mockUser);

      const result = await controller.softDelete(id);

      expect(mockService.softDelete).toHaveBeenCalledWith(id);
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException if service.softDelete throws it', async () => {
      mockService.softDelete = jest
        .fn()
        .mockRejectedValue(new NotFoundException());

      await expect(controller.softDelete(id)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException if service.softDelete throws it', async () => {
      mockService.softDelete = jest
        .fn()
        .mockRejectedValue(new ConflictException());

      await expect(controller.softDelete(id)).rejects.toThrow(
        ConflictException,
      );
    });
  });
  describe('GET /users/:id/tasks', () => {
    const userId = '1';
    const dto = [
      {
        id: 't1',
        titre: 'Task 1',
        description: 'Desc 1',
        dateLimite: new Date(),
        statut: 'EN_COURS',
        creeLe: new Date(),
        modifieLe: new Date(),
        createur: { id: '2', prenom: 'Jane', nom: 'Doe' },
        dossier: {
          id: 'd1',
          numeroUnique: 'NUM123',
          titre: 'Dossier 1',
          type: 'TYPE_A',
        },
      },
    ];

    it('should return tasks for a user', async () => {
      mockService.getTasksByUser = jest.fn().mockResolvedValue(dto);

      const result = await controller.getTasksByUser(userId);

      expect(mockService.getTasksByUser).toHaveBeenCalledWith(userId);
      expect(result).toEqual(dto);
    });

    it('should throw NotFoundException if service throws', async () => {
      mockService.getTasksByUser = jest
        .fn()
        .mockRejectedValue(new NotFoundException());

      await expect(controller.getTasksByUser('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
