import { Test, TestingModule } from '@nestjs/testing';
import { DocumentsService } from './documents.service';
import { PrismaService } from '../prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { StatutDocument } from '@prisma/client';

// 🟢 Création de mocks
const mockPrisma = () => ({
  document: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findFirst: jest.fn(),
    count: jest.fn(),
  },
  dossier: {
    findUnique: jest.fn(),
  },
  commentaire: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  journalAudit: {
    create: jest.fn(),
  },
});

const mockCloudinary = () => ({
  uploadFile: jest.fn(),
});

describe('DocumentsService', () => {
  let service: DocumentsService;
  let prisma: ReturnType<typeof mockPrisma>;
  let cloudinary: ReturnType<typeof mockCloudinary>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentsService,
        { provide: PrismaService, useFactory: mockPrisma },
        { provide: CloudinaryService, useFactory: mockCloudinary },
      ],
    }).compile();

    service = module.get<DocumentsService>(DocumentsService);
    prisma = module.get(PrismaService);
    cloudinary = module.get(CloudinaryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('should return a document if found', async () => {
      const doc = { id: '1', statut: StatutDocument.ACTIF };
      prisma.document.findUnique.mockResolvedValue(doc);

      const result = await service.findOne('1');
      expect(result).toEqual(doc);
      expect(prisma.document.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException if document not found', async () => {
      prisma.document.findUnique.mockResolvedValue(null);

      await expect(service.findOne('1')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if document is deleted', async () => {
      prisma.document.findUnique.mockResolvedValue({
        id: '1',
        statut: StatutDocument.SUPPRIME,
      });

      await expect(service.findOne('1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('upload', () => {
    it('should upload file and create document', async () => {
      const file = {} as Express.Multer.File;
      const dto = { dossierId: 'd1', titre: 'titre', type: 'PDF' };
      cloudinary.uploadFile.mockResolvedValue({ secure_url: 'http://url' });
      prisma.document.create.mockResolvedValue({ id: '1', ...dto });

      const result = await service.upload(file, dto, 'user1');
      expect(result).toEqual({ id: '1', ...dto });
      expect(cloudinary.uploadFile).toHaveBeenCalledWith(file);
    });
  });

  describe('updateMetadata', () => {
    it('should update metadata successfully', async () => {
      const id = '1';
      const dto = { titre: 'Nouveau titre' };
      prisma.document.findUnique.mockResolvedValue({
        id,
        statut: StatutDocument.ACTIF,
        dossierId: 'd1',
      });
      prisma.document.update.mockResolvedValue({ id, titre: 'Nouveau titre' });

      const result = await service.updateMetadata(id, dto, 'user1');
      expect(result).toEqual({ id, titre: 'Nouveau titre' });
    });

    it('should throw NotFoundException if document does not exist', async () => {
      prisma.document.findUnique.mockResolvedValue(null);
      await expect(
        service.updateMetadata('1', { titre: 'x' }, 'user1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if document is deleted', async () => {
      prisma.document.findUnique.mockResolvedValue({
        id: '1',
        statut: StatutDocument.SUPPRIME,
      });
      await expect(
        service.updateMetadata('1', { titre: 'x' }, 'user1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('softDelete', () => {
    it('should soft delete a document', async () => {
      const doc = { id: '1', statut: StatutDocument.ACTIF };
      prisma.document.findUnique.mockResolvedValue(doc);
      prisma.document.update.mockResolvedValue({
        ...doc,
        statut: StatutDocument.SUPPRIME,
      });
      prisma.journalAudit.create.mockResolvedValue({});

      const result = await service.softDelete('1', 'user1');
      expect(result).toHaveProperty('message');
      expect(result.document.statut).toBe(StatutDocument.SUPPRIME);
    });

    it('should throw NotFoundException if document not found', async () => {
      prisma.document.findUnique.mockResolvedValue(null);
      await expect(service.softDelete('1', 'user1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if already deleted', async () => {
      prisma.document.findUnique.mockResolvedValue({
        id: '1',
        statut: StatutDocument.SUPPRIME,
      });
      await expect(service.softDelete('1', 'user1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
