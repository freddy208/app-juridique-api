import { Test, TestingModule } from '@nestjs/testing';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { FilterMessageDto } from './dto/filter-message.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { CreateReactionDto } from './dto/create-reaction.dto';

describe('MessagesController', () => {
  let controller: MessagesController;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let service: MessagesService;

  // --- Mock du service ---
  const mockService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    getReactions: jest.fn(),
    addReaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MessagesController],
      providers: [{ provide: MessagesService, useValue: mockService }],
    }).compile();

    controller = module.get<MessagesController>(MessagesController);
    service = module.get<MessagesService>(MessagesService);

    jest.clearAllMocks();
  });

  it('✅ Controller should be defined', () => {
    expect(controller).toBeDefined();
  });

  // --- TEST: findAll ---
  describe('findAll', () => {
    it('devrait appeler le service avec le bon DTO', async () => {
      const dto: FilterMessageDto = { page: 1, limit: 10 };
      const expected = { total: 1, data: [] };
      mockService.findAll.mockResolvedValue(expected);

      const result = await controller.findAll(dto);
      expect(result).toEqual(expected);
      expect(mockService.findAll).toHaveBeenCalledWith(dto);
    });
  });

  // --- TEST: findOne ---
  describe('findOne', () => {
    it('devrait retourner un message spécifique', async () => {
      const message = { id: '1', contenu: 'Hello' };
      mockService.findOne.mockResolvedValue(message);

      const result = await controller.findOne('1');
      expect(result).toEqual(message);
      expect(mockService.findOne).toHaveBeenCalledWith('1');
    });
  });

  // --- TEST: create ---
  describe('create', () => {
    it('devrait créer un message', async () => {
      const dto: CreateMessageDto = {
        contenu: 'Bonjour',
        dossierId: 'D1',
        expediteurId: 'U1',
      };
      const mockResult = { message: 'Message créé', data: { id: 'M1' } };
      mockService.create.mockResolvedValue(mockResult);

      const result = await controller.create(dto);
      expect(result).toEqual(mockResult);
      expect(mockService.create).toHaveBeenCalledWith(dto);
    });
  });

  // --- TEST: update ---
  describe('update', () => {
    it('devrait mettre à jour un message', async () => {
      const dto: UpdateMessageDto = { contenu: 'Modifié' };
      const mockResult = { message: 'Message mis à jour', data: { id: 'M1' } };
      mockService.update.mockResolvedValue(mockResult);

      const result = await controller.update('M1', dto);
      expect(result).toEqual(mockResult);
      expect(mockService.update).toHaveBeenCalledWith('M1', dto);
    });
  });

  // --- TEST: remove ---
  describe('remove', () => {
    it('devrait supprimer un message', async () => {
      const mockResult = { message: 'Message supprimé', data: { id: 'M1' } };
      mockService.remove.mockResolvedValue(mockResult);

      const result = await controller.remove('M1');
      expect(result).toEqual(mockResult);
      expect(mockService.remove).toHaveBeenCalledWith('M1');
    });
  });

  // --- TEST: getReactions ---
  describe('getReactions', () => {
    it('devrait retourner les réactions du message', async () => {
      const mockResult = { total: 1, data: [{ id: 'R1', type: 'LIKE' }] };
      mockService.getReactions.mockResolvedValue(mockResult);

      const result = await controller.getReactions('M1');
      expect(result).toEqual(mockResult);
      expect(mockService.getReactions).toHaveBeenCalledWith('M1');
    });
  });

  // --- TEST: addReaction ---
  describe('addReaction', () => {
    it('devrait ajouter une réaction au message', async () => {
      const dto: CreateReactionDto = { utilisateurId: 'U1', type: 'LOVE' };
      const mockResult = { message: 'Réaction ajoutée', data: { id: 'R1' } };
      mockService.addReaction.mockResolvedValue(mockResult);

      const result = await controller.addReaction('M1', dto);
      expect(result).toEqual(mockResult);
      expect(mockService.addReaction).toHaveBeenCalledWith('M1', dto);
    });
  });
});
