// src/factures/factures.service.ts
import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { FilterInvoiceDto } from './dto/filter-invoice.dto';
import { Prisma, StatutFacture } from '@prisma/client';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';

@Injectable()
export class FacturesService {
  constructor(private prisma: PrismaService) {}

  async findAll(filterDto: FilterInvoiceDto) {
    const {
      clientId,
      dossierId,
      statut,
      recherche,
      page = 1,
      limit = 20,
    } = filterDto;
    const skip = (page - 1) * limit;

    const where: Prisma.FactureWhereInput = {
      clientId: clientId || undefined,
      dossierId: dossierId || undefined,
      statut: statut
        ? { equals: statut, not: 'SUPPRIME' }
        : { not: 'SUPPRIME' },
      OR: recherche
        ? [
            { id: { contains: recherche, mode: 'insensitive' } },
            { montant: { equals: Number(recherche) || undefined } },
          ]
        : undefined,
    };

    try {
      const [factures, total] = await Promise.all([
        this.prisma.facture.findMany({
          where,
          include: {
            client: {
              select: {
                id: true,
                prenom: true,
                nom: true,
                nomEntreprise: true,
              },
            },
            dossier: {
              select: {
                id: true,
                numeroUnique: true,
                titre: true,
                statut: true,
              },
            },
          },
          orderBy: { creeLe: 'desc' },
          skip,
          take: limit,
        }),
        this.prisma.facture.count({ where }),
      ]);

      return {
        total,
        page,
        limit,
        data: factures,
      };
    } catch (error) {
      console.error('Erreur récupération factures :', error);
      throw new BadRequestException(
        'Erreur lors de la récupération des factures',
      );
    }
  }
  // Ajoutez d'autres méthodes de service si nécessaire

  async findOne(id: string) {
    if (!id) {
      throw new BadRequestException('L’identifiant de la facture est requis.');
    }

    const facture = await this.prisma.facture.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            id: true,
            prenom: true,
            nom: true,
            nomEntreprise: true,
            telephone: true,
            email: true,
          },
        },
        dossier: {
          select: {
            id: true,
            numeroUnique: true,
            titre: true,
            type: true,
            statut: true,
          },
        },
      },
    });

    if (!facture || facture.statut === 'SUPPRIME') {
      throw new NotFoundException('Facture introuvable ou supprimée.');
    }

    return facture;
  }
  //...
  async create(createInvoiceDto: CreateInvoiceDto) {
    const {
      clientId,
      dossierId,
      montant,
      dateEcheance,
      payee = false,
      statut = 'BROUILLON',
    } = createInvoiceDto;

    // Vérifier que le client existe
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
    });
    if (!client || client.statut !== 'ACTIF') {
      throw new BadRequestException('Client invalide ou inactif.');
    }

    // Vérifier que le dossier existe si fourni
    if (dossierId) {
      const dossier = await this.prisma.dossier.findUnique({
        where: { id: dossierId },
      });
      if (!dossier || dossier.statut === 'SUPPRIME') {
        throw new BadRequestException('Dossier invalide ou supprimé.');
      }
    }

    try {
      const facture = await this.prisma.facture.create({
        data: {
          clientId,
          dossierId,
          montant,
          dateEcheance: new Date(dateEcheance),
          payee,
          statut,
        },
        include: {
          client: {
            select: {
              id: true,
              prenom: true,
              nom: true,
              nomEntreprise: true,
              telephone: true,
              email: true,
            },
          },
          dossier: {
            select: {
              id: true,
              numeroUnique: true,
              titre: true,
              statut: true,
              type: true,
            },
          },
        },
      });

      return facture;
    } catch (error) {
      console.error('Erreur création facture :', error);
      throw new BadRequestException('Impossible de créer la facture.');
    }
  }

  // src/factures/factures.service.ts
  async update(id: string, updateInvoiceDto: UpdateInvoiceDto) {
    if (!id) {
      throw new BadRequestException('L’identifiant de la facture est requis.');
    }

    const facture = await this.prisma.facture.findUnique({
      where: { id },
    });

    if (!facture || facture.statut === 'SUPPRIME') {
      throw new NotFoundException('Facture introuvable ou supprimée.');
    }

    const { clientId, dossierId, montant, dateEcheance, payee, statut } =
      updateInvoiceDto;

    // Vérifier le client si fourni
    if (clientId) {
      const client = await this.prisma.client.findUnique({
        where: { id: clientId },
      });
      if (!client || client.statut !== 'ACTIF') {
        throw new BadRequestException('Client invalide ou inactif.');
      }
    }

    // Vérifier le dossier si fourni
    if (dossierId) {
      const dossier = await this.prisma.dossier.findUnique({
        where: { id: dossierId },
      });
      if (!dossier || dossier.statut === 'SUPPRIME') {
        throw new BadRequestException('Dossier invalide ou supprimé.');
      }
    }

    try {
      const updatedFacture = await this.prisma.facture.update({
        where: { id },
        data: {
          clientId,
          dossierId,
          montant,
          dateEcheance: dateEcheance ? new Date(dateEcheance) : undefined,
          payee,
          statut,
        },
        include: {
          client: {
            select: {
              id: true,
              prenom: true,
              nom: true,
              nomEntreprise: true,
              telephone: true,
              email: true,
            },
          },
          dossier: {
            select: {
              id: true,
              numeroUnique: true,
              titre: true,
              statut: true,
              type: true,
            },
          },
        },
      });

      return updatedFacture;
    } catch (error) {
      console.error('Erreur mise à jour facture :', error);
      throw new BadRequestException('Impossible de mettre à jour la facture.');
    }
  }
  async updateStatus(id: string, statut: StatutFacture) {
    if (!id) {
      throw new BadRequestException('L’identifiant de la facture est requis.');
    }

    const facture = await this.prisma.facture.findUnique({
      where: { id },
    });

    if (!facture || facture.statut === 'SUPPRIME') {
      throw new NotFoundException('Facture introuvable ou supprimée.');
    }

    try {
      const updatedFacture = await this.prisma.facture.update({
        where: { id },
        data: { statut },
        include: {
          client: {
            select: {
              id: true,
              prenom: true,
              nom: true,
              nomEntreprise: true,
              telephone: true,
              email: true,
            },
          },
          dossier: {
            select: {
              id: true,
              numeroUnique: true,
              titre: true,
              statut: true,
              type: true,
            },
          },
        },
      });

      return updatedFacture;
    } catch (error) {
      console.error('Erreur mise à jour statut facture :', error);
      throw new BadRequestException(
        'Impossible de mettre à jour le statut de la facture.',
      );
    }
  }
  // src/factures/factures.service.ts
  async markAsPaid(id: string) {
    if (!id) {
      throw new BadRequestException('L’identifiant de la facture est requis.');
    }

    const facture = await this.prisma.facture.findUnique({
      where: { id },
    });

    if (!facture || facture.statut === 'SUPPRIME') {
      throw new NotFoundException('Facture introuvable ou supprimée.');
    }

    if (facture.payee) {
      throw new BadRequestException('La facture est déjà marquée comme payée.');
    }

    try {
      const updatedFacture = await this.prisma.facture.update({
        where: { id },
        data: {
          payee: true,
          statut: 'PAYEE',
        },
        include: {
          client: {
            select: {
              id: true,
              prenom: true,
              nom: true,
              nomEntreprise: true,
              telephone: true,
              email: true,
            },
          },
          dossier: {
            select: {
              id: true,
              numeroUnique: true,
              titre: true,
              statut: true,
              type: true,
            },
          },
        },
      });

      return updatedFacture;
    } catch (error) {
      console.error(
        'Erreur lors du marquage de la facture comme payée :',
        error,
      );
      throw new BadRequestException(
        'Impossible de marquer la facture comme payée.',
      );
    }
  }
  // src/factures/factures.service.ts
  async softDelete(id: string) {
    if (!id) {
      throw new BadRequestException('L’identifiant de la facture est requis.');
    }

    const facture = await this.prisma.facture.findUnique({
      where: { id },
    });

    if (!facture || facture.statut === 'SUPPRIME') {
      throw new NotFoundException('Facture introuvable ou déjà supprimée.');
    }

    try {
      const deletedFacture = await this.prisma.facture.update({
        where: { id },
        data: { statut: 'SUPPRIME' },
        include: {
          client: {
            select: {
              id: true,
              prenom: true,
              nom: true,
              nomEntreprise: true,
              telephone: true,
              email: true,
            },
          },
          dossier: {
            select: {
              id: true,
              numeroUnique: true,
              titre: true,
              statut: true,
              type: true,
            },
          },
        },
      });

      return {
        message: 'Facture supprimée avec succès (soft delete).',
        facture: deletedFacture,
      };
    } catch (error) {
      console.error('Erreur suppression facture :', error);
      throw new BadRequestException('Impossible de supprimer la facture.');
    }
  }
}
