/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/await-thenable */
// documents.service.ts
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Injectable, NotFoundException, Logger, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { QueryDocumentDto } from './dto/query-document.dto';
import {
  DocumentResponse,
  DocumentStatsResponse,
} from './interfaces/document-response.interface';
import { PaginationUtil } from '../common/utils/pagination.util';
import { StatutDocument } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as Tesseract from 'tesseract.js';

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);
  private pdfParse: any = null;

  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private cloudinaryService: CloudinaryService,
  ) {
    // Initialiser pdf-parse de manière asynchrone
    void this.initPdfParse();
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  private async initPdfParse() {
    try {
      // Import dynamique avec require pour éviter les problèmes de types
      this.pdfParse = require('pdf-parse');
    } catch (error) {
      this.logger.error(
        `Erreur lors de l'initialisation de pdf-parse: ${error.message}`,
      );
    }
  }

  // -------------------- CRUD DE BASE --------------------
  async create(
    createDocumentDto: CreateDocumentDto,
    file: Express.Multer.File,
    userId: string,
  ): Promise<DocumentResponse> {
    const { dossierId, titre, type, taille, extension, statut } =
      createDocumentDto;

    // Vérifier l'existence du dossier
    await this.prisma.dossier.findUniqueOrThrow({ where: { id: dossierId } });

    // Vérifier si c'est une nouvelle version d'un document existant
    const existingDocuments = await this.prisma.document.findMany({
      where: { dossierId, titre, statut: StatutDocument.ACTIF },
      orderBy: { version: 'desc' },
      take: 1,
    });

    const version =
      existingDocuments.length > 0 ? existingDocuments[0].version + 1 : 1;

    // Upload du fichier sur Cloudinary
    const uploadResult = await this.cloudinaryService.uploadFile(file);

    // Extraire le texte du document pour l'OCR
    let contenuOCR = '';
    let indexeOCR = false;

    try {
      if (file.mimetype === 'application/pdf') {
        const dataBuffer = fs.readFileSync(file.path);

        // Attendre que pdf-parse soit initialisé si nécessaire
        if (!this.pdfParse) {
          await this.initPdfParse();
        }

        // Utiliser pdf-parse avec require
        const data = await this.pdfParse(dataBuffer);
        contenuOCR = data.text;
        indexeOCR = true;
      } else if (file.mimetype.startsWith('image/')) {
        const result = await Tesseract.recognize(file.buffer, 'fra', {
          logger: (m) => this.logger.log(m),
        });
        contenuOCR = result.data.text;
        indexeOCR = true;
      }
    } catch (error) {
      this.logger.error(`Erreur lors de l'OCR: ${error.message}`);
    }

    // Créer le document dans la base de données
    const newDocument = await this.prisma.document.create({
      data: {
        dossierId,
        televersePar: userId,
        titre,
        type,
        url: uploadResult.secure_url,
        version,
        statut: statut || StatutDocument.ACTIF,
        taille: taille || file.size,
        extension: extension || path.extname(file.originalname).substring(1),
        indexeOCR,
        contenuOCR,
      },
      include: {
        utilisateur: {
          select: { id: true, prenom: true, nom: true },
        },
        dossier: { select: { id: true, numeroUnique: true, titre: true } },
      },
    });

    // Nettoyer le fichier temporaire
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    await this.invalidateDocumentsCache();
    return this.formatDocumentResponse(newDocument);
  }

  async findAll(query: QueryDocumentDto): Promise<any> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'creeLe',
      sortOrder = 'desc',
      dossierId,
      televersePar,
      type,
      statut,
      titre,
      recherche,
    } = query;

    const cacheKey = `documents:${JSON.stringify(query)}`;
    const cachedResult = await this.cacheManager.get(cacheKey);
    if (cachedResult) return cachedResult;

    const where: any = {};
    if (dossierId) where.dossierId = dossierId;
    if (televersePar) where.televersePar = televersePar;
    if (type) where.type = type;
    if (statut) where.statut = statut;
    if (titre) where.titre = { contains: titre, mode: 'insensitive' };
    if (recherche) {
      where.OR = [
        { titre: { contains: recherche, mode: 'insensitive' } },
        { contenuOCR: { contains: recherche, mode: 'insensitive' } },
      ];
    }

    const paginationParams = PaginationUtil.getPrismaPaginationParams({
      page,
      limit,
      sortBy,
      sortOrder,
    });

    const [documents, total] = await Promise.all([
      this.prisma.document.findMany({
        where,
        ...paginationParams,
        include: {
          utilisateur: {
            select: { id: true, prenom: true, nom: true },
          },
          dossier: { select: { id: true, numeroUnique: true, titre: true } },
        },
      }),
      this.prisma.document.count({ where }),
    ]);

    const formattedDocuments = documents.map((doc) =>
      this.formatDocumentResponse(doc),
    );
    const result = PaginationUtil.createPaginationResult(
      formattedDocuments,
      total,
      { page, limit, sortBy, sortOrder },
    );

    await this.cacheManager.set(cacheKey, result, 300);
    return result;
  }

  async findOne(id: string): Promise<DocumentResponse> {
    const cacheKey = `document:${id}`;
    const cachedDocument = await this.cacheManager.get(cacheKey);
    if (cachedDocument) return cachedDocument as DocumentResponse;

    const document = await this.prisma.document.findUnique({
      where: { id },
      include: {
        utilisateur: {
          select: { id: true, prenom: true, nom: true },
        },
        dossier: { select: { id: true, numeroUnique: true, titre: true } },
      },
    });

    if (!document)
      throw new NotFoundException(`Document avec l'ID ${id} non trouvé`);

    await this.cacheManager.set(cacheKey, document, 600);
    return this.formatDocumentResponse(document);
  }

  async update(
    id: string,
    updateDocumentDto: UpdateDocumentDto,
  ): Promise<DocumentResponse> {
    const existingDocument = await this.prisma.document.findUnique({
      where: { id },
    });
    if (!existingDocument)
      throw new NotFoundException(`Document avec l'ID ${id} non trouvé`);

    const updatedDocument = await this.prisma.document.update({
      where: { id },
      data: updateDocumentDto,
      include: {
        utilisateur: {
          select: { id: true, prenom: true, nom: true },
        },
        dossier: { select: { id: true, numeroUnique: true, titre: true } },
      },
    });

    await this.cacheManager.del(`document:${id}`);
    await this.invalidateDocumentsCache();
    return this.formatDocumentResponse(updatedDocument);
  }

  async remove(id: string): Promise<void> {
    const existingDocument = await this.prisma.document.findUnique({
      where: { id },
    });
    if (!existingDocument)
      throw new NotFoundException(`Document avec l'ID ${id} non trouvé`);

    // Extraire le public_id de l'URL Cloudinary
    const urlParts = existingDocument.url.split('/');
    const publicId = urlParts.slice(-2).join('/').split('.')[0];

    // Supprimer le fichier de Cloudinary
    try {
      await this.cloudinaryService.deleteFile(publicId);
    } catch (error) {
      this.logger.error(
        `Erreur lors de la suppression du fichier Cloudinary: ${error.message}`,
      );
    }

    // Supprimer le document de la base de données
    await this.prisma.document.delete({ where: { id } });

    await this.cacheManager.del(`document:${id}`);
    await this.invalidateDocumentsCache();
  }

  // -------------------- MÉTHODES SPÉCIFIQUES --------------------

  async getVersions(documentId: string): Promise<DocumentResponse[]> {
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
    });
    if (!document)
      throw new NotFoundException(
        `Document avec l'ID ${documentId} non trouvé`,
      );

    const versions = await this.prisma.document.findMany({
      where: {
        dossierId: document.dossierId,
        titre: document.titre,
        statut: StatutDocument.ACTIF,
      },
      orderBy: { version: 'desc' },
      include: {
        utilisateur: {
          select: { id: true, prenom: true, nom: true },
        },
        dossier: { select: { id: true, numeroUnique: true, titre: true } },
      },
    });

    return versions.map((doc) => this.formatDocumentResponse(doc));
  }

  async searchByOCR(
    query: string,
    dossierId?: string,
  ): Promise<DocumentResponse[]> {
    const where: any = {
      indexeOCR: true,
      contenuOCR: { contains: query, mode: 'insensitive' },
    };

    if (dossierId) {
      where.dossierId = dossierId;
    }

    const documents = await this.prisma.document.findMany({
      where,
      include: {
        utilisateur: {
          select: { id: true, prenom: true, nom: true },
        },
        dossier: { select: { id: true, numeroUnique: true, titre: true } },
      },
    });

    return documents.map((doc) => this.formatDocumentResponse(doc));
  }

  async getStats(): Promise<DocumentStatsResponse> {
    const cacheKey = 'documents-stats';
    const cachedStats = await this.cacheManager.get(cacheKey);
    if (cachedStats) return cachedStats as DocumentStatsResponse;

    const [
      totalDocuments,
      documentsParType,
      documentsParStatut,
      documentsParMois,
      tailleTotale,
      documentsIndexes,
    ] = await Promise.all([
      this.prisma.document.count(),
      this.prisma.document.groupBy({
        by: ['type'],
        _count: true,
      }),
      this.prisma.document.groupBy({
        by: ['statut'],
        _count: true,
      }),
      this.prisma.$queryRaw`
        SELECT 
          TO_CHAR("creeLe", 'YYYY-MM') as mois,
          COUNT(*) as nombre
        FROM "Document" 
        WHERE "creeLe" >= date_trunc('year', CURRENT_DATE)
        GROUP BY TO_CHAR("creeLe", 'YYYY-MM')
        ORDER BY mois DESC
      ` as unknown as { mois: string; nombre: bigint }[],
      this.prisma.document.aggregate({
        _sum: { taille: true },
      }),
      this.prisma.document.aggregate({
        where: { indexeOCR: true },
        _count: true,
      }),
    ]);

    const stats: DocumentStatsResponse = {
      totalDocuments,
      tailleTotale: Number(tailleTotale._sum.taille || 0),
      documentsIndexes: Number(documentsIndexes._count),
      documentsParType: documentsParType.map((item) => ({
        type: item.type,
        count: item._count,
      })),
      documentsParStatut: documentsParStatut.map((item) => ({
        statut: item.statut,
        count: item._count,
      })),
      documentsParMois: documentsParMois.map((item) => ({
        mois: item.mois,
        nombre: Number(item.nombre),
      })),
    };

    await this.cacheManager.set(cacheKey, stats, 600);
    return stats;
  }

  // -------------------- MÉTHODES UTILITAIRES --------------------
  private formatDocumentResponse(document: any): DocumentResponse {
    return {
      ...document,
    };
  }

  private async invalidateDocumentsCache(): Promise<void> {
    try {
      if (
        'stores' in this.cacheManager &&
        Array.isArray(this.cacheManager.stores)
      ) {
        const store = this.cacheManager.stores[0];
        if ('keys' in store && typeof store.keys === 'function') {
          const keys = await store.keys('documents:*');
          if (
            keys.length > 0 &&
            'delete' in store &&
            typeof store.delete === 'function'
          ) {
            await Promise.all(keys.map((key) => store.delete(key)));
          }
        }
      }
    } catch (error) {
      this.logger.error(
        "Erreur lors de l'invalidation du cache des documents:",
        error,
      );
    }
  }
}
