import { Test, TestingModule } from '@nestjs/testing';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { UpdateDocumentStatusDto } from './dto/update-document-status.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { FilterDocumentDto } from './dto/filter-document.dto';

const mockDocumentsService = () => ({
  findAll: jest.fn(),
  findOne: jest.fn(),
  upload: jest.fn(),
  updateMetadata: jest.fn(),
  updateStatus: jest.fn(),
  softDelete: jest.fn(),
  getDocumentVersions: jest.fn(),
  addNewVersion: jest.fn(),
  getCommentsForDocument: jest.fn(),
  addCommentToDocument: jest.fn(),
  updateComment: jest.fn(),
  softDeleteComment: jest.fn(),
});

describe('DocumentsController', () => {
  let controller: DocumentsController;
  let service: ReturnType<typeof mockDocumentsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DocumentsController],
      providers: [
        { provide: DocumentsService, useFactory: mockDocumentsService },
      ],
    }).compile();

    controller = module.get<DocumentsController>(DocumentsController);
    service = module.get(DocumentsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should call service.findAll with filters', async () => {
      const filters: FilterDocumentDto = {
        type: 'PDF',
        skip: 0,
        take: 10,
        dossierId: undefined,
        statut: undefined,
      };
      const result = { totalCount: 1, skip: 0, take: 10, data: [] };
      service.findAll.mockResolvedValue(result);

      expect(await controller.findAll(filters)).toEqual(result);
      expect(service.findAll).toHaveBeenCalledWith(filters);
    });
  });

  describe('findOne', () => {
    it('should call service.findOne with id', async () => {
      const doc = { id: '1' };
      service.findOne.mockResolvedValue(doc);

      expect(await controller.findOne('1')).toEqual(doc);
      expect(service.findOne).toHaveBeenCalledWith('1');
    });
  });

  describe('upload', () => {
    it('should call service.upload with file, dto, userId', async () => {
      const file = {} as Express.Multer.File;
      const dto: UploadDocumentDto = {
        dossierId: 'd1',
        titre: 't',
        type: 'PDF',
      };
      const req = { user: { id: 'user1' } };
      const doc = { id: '1' };
      service.upload.mockResolvedValue(doc);

      expect(await controller.upload(file, dto, req)).toEqual(doc);
      expect(service.upload).toHaveBeenCalledWith(file, dto, 'user1');
    });
  });

  describe('update', () => {
    it('should call service.updateMetadata', async () => {
      const dto: UpdateDocumentDto = { titre: 'New' };
      const user = { id: 'user1' };
      const doc = { id: '1', titre: 'New' };
      service.updateMetadata.mockResolvedValue(doc);

      expect(await controller.update('1', dto, user)).toEqual(doc);
      expect(service.updateMetadata).toHaveBeenCalledWith('1', dto, 'user1');
    });
  });

  describe('updateStatus', () => {
    it('should call service.updateStatus', async () => {
      const dto: UpdateDocumentStatusDto = { statut: 'ARCHIVE' };
      const user = { id: 'user1' };
      const doc = { id: '1', statut: 'ARCHIVE' };
      service.updateStatus.mockResolvedValue(doc);

      expect(await controller.updateStatus('1', dto, user)).toEqual(doc);
      expect(service.updateStatus).toHaveBeenCalledWith('1', dto, 'user1');
    });
  });

  describe('softDelete', () => {
    it('should call service.softDelete', async () => {
      const user = { id: 'user1' };
      const result = { message: 'ok', document: { id: '1' } };
      service.softDelete.mockResolvedValue(result);

      expect(await controller.softDelete('1', user)).toEqual(result);
      expect(service.softDelete).toHaveBeenCalledWith('1', 'user1');
    });
  });

  describe('getVersions', () => {
    it('should call service.getDocumentVersions', async () => {
      const result = { totalVersions: 2, documentId: '1', versions: [] };
      service.getDocumentVersions.mockResolvedValue(result);

      expect(await controller.getVersions('1')).toEqual(result);
      expect(service.getDocumentVersions).toHaveBeenCalledWith('1');
    });
  });

  describe('addVersion', () => {
    it('should call service.addNewVersion', async () => {
      const file = {} as Express.Multer.File;
      const user = { id: 'user1' };
      const doc = { id: '1', version: 2 };
      service.addNewVersion.mockResolvedValue(doc);

      expect(await controller.addVersion('1', file, user)).toEqual(doc);
      expect(service.addNewVersion).toHaveBeenCalledWith('1', file, 'user1');
    });
  });

  describe('getComments', () => {
    it('should call service.getCommentsForDocument', async () => {
      const result = { total: 0, documentId: '1', comments: [] };
      service.getCommentsForDocument.mockResolvedValue(result);

      expect(await controller.getComments('1')).toEqual(result);
      expect(service.getCommentsForDocument).toHaveBeenCalledWith('1');
    });
  });

  describe('addComment', () => {
    it('should call service.addCommentToDocument', async () => {
      const dto: CreateCommentDto = { contenu: 'Test' };
      const user = { id: 'user1' };
      const comment = { id: 'c1', contenu: 'Test' };
      service.addCommentToDocument.mockResolvedValue(comment);

      expect(await controller.addComment('1', dto, user)).toEqual(comment);
      expect(service.addCommentToDocument).toHaveBeenCalledWith(
        '1',
        dto,
        'user1',
      );
    });
  });

  describe('updateComment', () => {
    it('should call service.updateComment', async () => {
      const dto: UpdateCommentDto = { contenu: 'Updated' };
      const user = { id: 'user1' };
      const comment = { id: 'c1', contenu: 'Updated' };
      service.updateComment.mockResolvedValue(comment);

      expect(await controller.updateComment('1', 'c1', dto, user)).toEqual(
        comment,
      );
      expect(service.updateComment).toHaveBeenCalledWith(
        '1',
        'c1',
        dto,
        'user1',
      );
    });
  });

  describe('softDeleteComment', () => {
    it('should call service.softDeleteComment', async () => {
      const user = { id: 'user1' };
      const result = { message: 'Deleted', commentaire: { id: 'c1' } };
      service.softDeleteComment.mockResolvedValue(result);

      expect(await controller.softDeleteComment('1', 'c1', user)).toEqual(
        result,
      );
      expect(service.softDeleteComment).toHaveBeenCalledWith(
        '1',
        'c1',
        'user1',
      );
    });
  });
});
