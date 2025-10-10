import { Test, TestingModule } from '@nestjs/testing';
import { MessagesService } from './messages.service';
import { PrismaService } from '../prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

// --- Mock du PrismaService ---
const prismaMock = {
  messageChat: {
    findMany: jest.fn(),
    count: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  utilisateur: {
    findUnique: jest.fn(),
  },
  dossier: {
    findUnique: jest.fn(),
  },
  reactionMessage: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
};

describe('MessagesService', () => {
  let service: MessagesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagesService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<MessagesService>(MessagesService);

    // Reset des mocks entre chaque test
    jest.clearAllMocks();
  });

  it('✅ service should be defined', () => {
    expect(service).toBeDefined();
  });

  // --- TEST: findAll ---
  describe('findAll', () => {
    it('devrait retourner la liste des messages', async () => {
      prismaMock.messageChat.findMany.mockResolvedValue([
        { id: '1', contenu: 'Bonjour' },
      ]);
      prismaMock.messageChat.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 10 });
      expect(result.total).toBe(1);
      expect(result.data.length).toBe(1);
      expect(prismaMock.messageChat.findMany).toHaveBeenCalled();
    });

    it('devrait lancer une BadRequestException en cas d’erreur Prisma', async () => {
      prismaMock.messageChat.findMany.mockRejectedValue(new Error('DB error'));
      await expect(service.findAll({})).rejects.toThrow(BadRequestException);
    });
  });

  // --- TEST: findOne ---
  describe('findOne', () => {
    it('devrait retourner un message valide', async () => {
      const mockMessage = { id: '1', contenu: 'Salut', statut: 'ENVOYE' };
      prismaMock.messageChat.findUnique.mockResolvedValue(mockMessage);

      const result = await service.findOne('1');
      expect(result).toEqual(mockMessage);
    });

    it('devrait lancer NotFoundException si message introuvable', async () => {
      prismaMock.messageChat.findUnique.mockResolvedValue(null);
      await expect(service.findOne('999')).rejects.toThrow(NotFoundException);
    });

    it('devrait lancer BadRequestException si message supprimé', async () => {
      prismaMock.messageChat.findUnique.mockResolvedValue({
        id: '1',
        statut: 'SUPPRIME',
      });
      await expect(service.findOne('1')).rejects.toThrow(BadRequestException);
    });
  });

  // --- TEST: create ---
  describe('create', () => {
    const dto = {
      contenu: 'Hello',
      dossierId: 'D1',
      expediteurId: 'U1',
    };

    it('devrait créer un message avec succès', async () => {
      prismaMock.utilisateur.findUnique.mockResolvedValue({ id: 'U1' });
      prismaMock.dossier.findUnique.mockResolvedValue({
        id: 'D1',
        statut: 'OUVERT',
      });
      prismaMock.messageChat.create.mockResolvedValue({
        id: 'M1',
        contenu: 'Hello',
      });

      const result = await service.create(dto);
      expect(result.data.id).toBe('M1');
      expect(prismaMock.messageChat.create).toHaveBeenCalled();
    });

    it('devrait lancer NotFoundException si expéditeur inexistant', async () => {
      prismaMock.utilisateur.findUnique.mockResolvedValue(null);
      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
    });

    it('devrait lancer BadRequestException si dossier supprimé', async () => {
      prismaMock.utilisateur.findUnique.mockResolvedValue({ id: 'U1' });
      prismaMock.dossier.findUnique.mockResolvedValue({
        id: 'D1',
        statut: 'SUPPRIME',
      });
      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });
  });

  // --- TEST: update ---
  describe('update', () => {
    const id = 'M1';
    const dto = { contenu: 'Modifié' };

    it('devrait mettre à jour le message', async () => {
      prismaMock.messageChat.findUnique.mockResolvedValue({
        id,
        contenu: 'Ancien',
        statut: 'ENVOYE',
      });
      prismaMock.messageChat.update.mockResolvedValue({
        id,
        contenu: 'Modifié',
      });

      const result = await service.update(id, dto);
      expect(result.data.contenu).toBe('Modifié');
    });

    it('devrait lancer NotFoundException si message inexistant', async () => {
      prismaMock.messageChat.findUnique.mockResolvedValue(null);
      await expect(service.update(id, dto)).rejects.toThrow(NotFoundException);
    });

    it('devrait lancer BadRequestException si message supprimé', async () => {
      prismaMock.messageChat.findUnique.mockResolvedValue({
        id,
        statut: 'SUPPRIME',
      });
      await expect(service.update(id, dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // --- TEST: remove ---
  describe('remove', () => {
    it('devrait soft delete un message', async () => {
      prismaMock.messageChat.findUnique.mockResolvedValue({
        id: '1',
        statut: 'ENVOYE',
      });
      prismaMock.messageChat.update.mockResolvedValue({
        id: '1',
        statut: 'SUPPRIME',
      });

      const result = await service.remove('1');
      expect(result.data.statut).toBe('SUPPRIME');
    });

    it('devrait lancer NotFoundException si message inexistant', async () => {
      prismaMock.messageChat.findUnique.mockResolvedValue(null);
      await expect(service.remove('999')).rejects.toThrow(NotFoundException);
    });

    it('devrait lancer BadRequestException si déjà supprimé', async () => {
      prismaMock.messageChat.findUnique.mockResolvedValue({
        id: '1',
        statut: 'SUPPRIME',
      });
      await expect(service.remove('1')).rejects.toThrow(BadRequestException);
    });
  });

  // --- TEST: getReactions ---
  describe('getReactions', () => {
    it('devrait retourner les réactions', async () => {
      prismaMock.messageChat.findUnique.mockResolvedValue({
        id: '1',
        statut: 'ENVOYE',
      });
      prismaMock.reactionMessage.findMany.mockResolvedValue([
        { id: 'R1', type: 'LIKE' },
      ]);

      const result = await service.getReactions('1');
      expect(result.total).toBe(1);
    });

    it('devrait lancer NotFoundException si message inexistant', async () => {
      prismaMock.messageChat.findUnique.mockResolvedValue(null);
      await expect(service.getReactions('1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('devrait lancer BadRequestException si message supprimé', async () => {
      prismaMock.messageChat.findUnique.mockResolvedValue({
        id: '1',
        statut: 'SUPPRIME',
      });
      await expect(service.getReactions('1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // --- TEST: addReaction ---
  describe('addReaction', () => {
    const messageId = 'M1';
    const dto = { utilisateurId: 'U1', type: 'LIKE' };

    it('devrait créer une nouvelle réaction', async () => {
      prismaMock.messageChat.findUnique.mockResolvedValue({
        id: messageId,
        statut: 'ENVOYE',
      });
      prismaMock.utilisateur.findUnique.mockResolvedValue({
        id: 'U1',
        statut: 'ACTIF',
      });
      prismaMock.reactionMessage.findUnique.mockResolvedValue(null);
      prismaMock.reactionMessage.create.mockResolvedValue({
        id: 'R1',
        type: 'LIKE',
      });

      const result = await service.addReaction(messageId, dto);
      expect(result.message).toContain('ajoutée');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(result.data.type).toBe('LIKE');
    });

    it('devrait mettre à jour une réaction existante', async () => {
      prismaMock.messageChat.findUnique.mockResolvedValue({
        id: messageId,
        statut: 'ENVOYE',
      });
      prismaMock.utilisateur.findUnique.mockResolvedValue({
        id: 'U1',
        statut: 'ACTIF',
      });
      prismaMock.reactionMessage.findUnique.mockResolvedValue({
        id: 'R1',
        type: 'LIKE',
      });
      prismaMock.reactionMessage.update.mockResolvedValue({
        id: 'R1',
        type: 'LOVE',
      });

      const result = await service.addReaction(messageId, {
        utilisateurId: 'U1',
        type: 'LOVE',
      });
      expect(result.message).toContain('mise à jour');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(result.data.type).toBe('LOVE');
    });

    it('devrait lancer NotFoundException si message inexistant', async () => {
      prismaMock.messageChat.findUnique.mockResolvedValue(null);
      await expect(service.addReaction(messageId, dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('devrait lancer BadRequestException si utilisateur inactif', async () => {
      prismaMock.messageChat.findUnique.mockResolvedValue({
        id: messageId,
        statut: 'ENVOYE',
      });
      prismaMock.utilisateur.findUnique.mockResolvedValue({
        id: 'U1',
        statut: 'INACTIF',
      });
      await expect(service.addReaction(messageId, dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
