// clients.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { AddClientNoteDto } from './dto/add-client-note.dto';
import {
  AddIdentityDocumentDto,
  TypeDocumentIdentite,
} from './dto/add-identity-document.dto';

describe('ClientsController', () => {
  let controller: ClientsController;
  let service: ClientsService;
  let cloudinary: CloudinaryService;

  // Mock générique pour tous les services
  const mockClientsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    getGlobalStats: jest.fn(),
    getInactiveClients: jest.fn(),
    getAvailableStatuses: jest.fn(),
    findOne: jest.fn(),
    getClientStats: jest.fn(),
    getClientPerformance: jest.fn(),
    getClientActivity: jest.fn(),
    getFinancialSummary: jest.fn(),
    update: jest.fn(),
    changeStatus: jest.fn(),
    markLastVisit: jest.fn(),
    addIdentityDocument: jest.fn(),
    addNote: jest.fn(),
    bulkAction: jest.fn(),
    remove: jest.fn(),
  };

  const mockCloudinaryService = {
    uploadFile: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClientsController],
      providers: [
        { provide: ClientsService, useValue: mockClientsService },
        { provide: CloudinaryService, useValue: mockCloudinaryService },
      ],
    }).compile();

    controller = module.get<ClientsController>(ClientsController);
    service = module.get<ClientsService>(ClientsService);
    cloudinary = module.get<CloudinaryService>(CloudinaryService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call clientsService.create with correct dto', async () => {
      const dto: CreateClientDto = {
        nom: 'Doe',
        prenom: 'John',
        email: 'john@example.com',
      };
      const result = { id: '1', ...dto };
      mockClientsService.create.mockResolvedValue(result);

      expect(await controller.create(dto)).toEqual(result);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAll', () => {
    it('should call clientsService.findAll with pagination and filters', async () => {
      const result = [{ id: '1', nom: 'Doe' }];
      mockClientsService.findAll.mockResolvedValue(result);

      expect(await controller.findAll(1, 10, 'creeLe', 'desc', {})).toEqual(
        result,
      );
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        sortBy: 'creeLe',
        sortOrder: 'desc',
        filters: {},
      });
    });
  });

  describe('findOne', () => {
    it('should call clientsService.findOne with id', async () => {
      const result = { id: '1', nom: 'Doe' };
      mockClientsService.findOne.mockResolvedValue(result);

      expect(await controller.findOne('1')).toEqual(result);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.findOne).toHaveBeenCalledWith('1');
    });
  });

  describe('update', () => {
    it('should call clientsService.update with id and dto', async () => {
      const dto: UpdateClientDto = { nom: 'Smith' };
      const result = { id: '1', ...dto };
      mockClientsService.update.mockResolvedValue(result);

      expect(await controller.update('1', dto)).toEqual(result);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.update).toHaveBeenCalledWith('1', dto);
    });
  });

  describe('addIdentityDocument', () => {
    it('should upload file to cloudinary and call clientsService.addIdentityDocument', async () => {
      const file = { originalname: 'doc.pdf' } as Express.Multer.File;
      const uploadResult = { url: 'http://cloudinary/doc.pdf' };
      const dto: AddIdentityDocumentDto = {
        titre: 'Carte d’identité',
        type: TypeDocumentIdentite.CNI,
      };

      const result = { id: '1', documentUrl: uploadResult.url };

      mockCloudinaryService.uploadFile.mockResolvedValue(uploadResult);
      mockClientsService.addIdentityDocument.mockResolvedValue(result);

      expect(await controller.addIdentityDocument('1', file, dto)).toEqual(
        result,
      );
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(cloudinary.uploadFile).toHaveBeenCalledWith(file);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.addIdentityDocument).toHaveBeenCalledWith(
        '1',
        dto,
        uploadResult,
      );
    });
  });

  describe('addNote', () => {
    it('should call clientsService.addNote with id, userId and dto', async () => {
      const dto: AddClientNoteDto = {
        titre: 'Note importante',
        contenu: 'Note test',
      };
      const result = { id: 'note1', titre: dto.titre, contenu: dto.contenu };
      mockClientsService.addNote.mockResolvedValue(result);

      expect(await controller.addNote('1', 'user1', dto)).toEqual(result);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.addNote).toHaveBeenCalledWith('1', 'user1', dto);
    });
  });

  describe('remove', () => {
    it('should call clientsService.remove with id', async () => {
      const result = { success: true };
      mockClientsService.remove.mockResolvedValue(result);

      expect(await controller.remove('1')).toEqual(result);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.remove).toHaveBeenCalledWith('1');
    });
  });

  // Tu peux continuer à faire pareil pour toutes les autres méthodes...
});
