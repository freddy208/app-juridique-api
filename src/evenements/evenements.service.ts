// src/evenements/evenements.service.ts
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { FilterEvenementDto } from './dto/filter-evenement.dto';
import { Prisma } from '@prisma/client';
import { CreateEvenementDto } from './dto/create-evenement.dto';
import { UpdateEvenementDto } from './dto/update-evenement.dto';

@Injectable()
export class EvenementsService {
  constructor(private prisma: PrismaService) {}

  async findAll(filters: FilterEvenementDto) {
    const {
      dossierId,
      creeParId,
      statut,
      search,
      dateDebut,
      dateFin,
      skip,
      take,
    } = filters;

    const where: Prisma.EvenementCalendrierWhereInput = {
      statut: { not: 'SUPPRIME' },
      ...(dossierId && { dossierId }),
      ...(creeParId && { creeParId }),
      ...(statut && { statut }),
      ...(search && {
        OR: [
          { titre: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(dateDebut && { debut: { gte: new Date(dateDebut) } }),
      ...(dateFin && { fin: { lte: new Date(dateFin) } }),
    };

    const [data, total] = await Promise.all([
      this.prisma.evenementCalendrier.findMany({
        where,
        include: {
          dossier: { select: { id: true, titre: true, numeroUnique: true } },
          createur: {
            select: { id: true, prenom: true, nom: true, role: true },
          },
        },
        orderBy: { debut: 'desc' },
        skip,
        take,
      }),
      this.prisma.evenementCalendrier.count({ where }),
    ]);

    return { total, data };
  }
  // 🆕 Nouveau endpoint : GET /events/:id
  async findOne(id: string) {
    const evenement = await this.prisma.evenementCalendrier.findUnique({
      where: { id },
      include: {
        dossier: {
          select: { id: true, titre: true, numeroUnique: true, type: true },
        },
        createur: {
          select: {
            id: true,
            prenom: true,
            nom: true,
            role: true,
            email: true,
          },
        },
      },
    });

    if (!evenement || evenement.statut === 'SUPPRIME') {
      throw new NotFoundException(`Événement introuvable ou supprimé`);
    }

    return evenement;
  }
  // 🆕 POST /events
  async create(dto: CreateEvenementDto, utilisateurId: string) {
    const { dossierId, titre, description, debut, fin } = dto;

    // Vérif : date fin > date début
    if (new Date(fin) <= new Date(debut)) {
      throw new BadRequestException(
        'La date de fin doit être postérieure à la date de début',
      );
    }

    // Vérif : dossier existant si fourni
    if (dossierId) {
      const dossier = await this.prisma.dossier.findUnique({
        where: { id: dossierId },
      });
      if (!dossier) {
        throw new NotFoundException(`Dossier introuvable`);
      }
      if (dossier.statut === 'SUPPRIME') {
        throw new BadRequestException(
          `Impossible d’attacher un dossier supprimé`,
        );
      }
    }

    // Création de l’événement
    const evenement = await this.prisma.evenementCalendrier.create({
      data: {
        titre,
        description,
        debut: new Date(debut),
        fin: new Date(fin),
        dossierId,
        creeParId: utilisateurId,
        statut: 'PREVU',
      },
      include: {
        dossier: {
          select: { id: true, titre: true, numeroUnique: true, type: true },
        },
        createur: {
          select: {
            id: true,
            prenom: true,
            nom: true,
            role: true,
            email: true,
          },
        },
      },
    });

    // Journalisation rapide (Audit interne)
    await this.prisma.journalAudit.create({
      data: {
        utilisateurId,
        action: `Création d’un événement`,
        typeCible: 'EvenementCalendrier',
        cibleId: evenement.id,
        nouvelleValeur: evenement,
      },
    });

    return evenement;
  }

  // 🆕 PUT /events/:id
  async update(id: string, dto: UpdateEvenementDto, utilisateurId: string) {
    const evenement = await this.prisma.evenementCalendrier.findUnique({
      where: { id },
    });

    if (!evenement || evenement.statut === 'SUPPRIME') {
      throw new NotFoundException(`Événement introuvable ou supprimé`);
    }

    // ⚠️ Vérif : Seul le créateur ou un admin peut modifier
    const user = await this.prisma.utilisateur.findUnique({
      where: { id: utilisateurId },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    if (evenement.creeParId !== utilisateurId && user.role !== 'ADMIN') {
      throw new BadRequestException(
        `Vous n'avez pas le droit de modifier cet événement`,
      );
    }

    // ⚠️ Vérif dossier si changé
    if (dto.dossierId) {
      const dossier = await this.prisma.dossier.findUnique({
        where: { id: dto.dossierId },
      });
      if (!dossier) throw new NotFoundException('Dossier introuvable');
      if (dossier.statut === 'SUPPRIME') {
        throw new BadRequestException(`Impossible de lier un dossier supprimé`);
      }
    }

    // ⚠️ Vérif cohérence des dates
    if (dto.debut && dto.fin && new Date(dto.fin) <= new Date(dto.debut)) {
      throw new BadRequestException(
        'La date de fin doit être postérieure à la date de début',
      );
    }

    // Ancienne valeur pour audit
    const ancienneValeur = { ...evenement };

    // ✅ Mise à jour
    const updated = await this.prisma.evenementCalendrier.update({
      where: { id },
      data: {
        ...dto,
        debut: dto.debut ? new Date(dto.debut) : evenement.debut,
        fin: dto.fin ? new Date(dto.fin) : evenement.fin,
      },
      include: {
        dossier: {
          select: { id: true, titre: true, numeroUnique: true, type: true },
        },
        createur: {
          select: {
            id: true,
            prenom: true,
            nom: true,
            role: true,
            email: true,
          },
        },
      },
    });

    // 🧾 Journalisation (audit interne)
    await this.prisma.journalAudit.create({
      data: {
        utilisateurId,
        action: `Modification d’un événement`,
        typeCible: 'EvenementCalendrier',
        cibleId: id,
        ancienneValeur,
        nouvelleValeur: updated,
      },
    });

    return updated;
  }
  // 🆕 PATCH /events/:id/status
  async updateStatus(
    id: string,
    nouveauStatut: 'PREVU' | 'TERMINE' | 'ANNULE',
    utilisateurId: string,
  ) {
    // 1. Vérifier que l'événement existe
    const evenement = await this.prisma.evenementCalendrier.findUnique({
      where: { id },
    });

    if (!evenement || evenement.statut === 'SUPPRIME') {
      throw new NotFoundException(`Événement introuvable ou supprimé`);
    }

    // 2. Vérifier que le statut demandé est valide
    const statutsAutorises = ['PREVU', 'TERMINE', 'ANNULE'];
    if (!statutsAutorises.includes(nouveauStatut)) {
      throw new BadRequestException(
        `Statut invalide. Valeurs autorisées : ${statutsAutorises.join(', ')}`,
      );
    }

    // 3. Vérifier que l'utilisateur existe
    const utilisateur = await this.prisma.utilisateur.findUnique({
      where: { id: utilisateurId },
    });

    if (!utilisateur) {
      throw new NotFoundException(`Utilisateur introuvable`);
    }

    // 4. Vérifier droits (créateur ou admin)
    if (evenement.creeParId !== utilisateurId && utilisateur.role !== 'ADMIN') {
      throw new BadRequestException(
        `Vous n'avez pas le droit de modifier le statut de cet événement`,
      );
    }

    // 5. Ancienne valeur pour audit
    const ancienneValeur = { ...evenement };

    // 6. Mise à jour du statut
    const updated = await this.prisma.evenementCalendrier.update({
      where: { id },
      data: { statut: nouveauStatut },
      include: {
        dossier: {
          select: { id: true, titre: true, numeroUnique: true, type: true },
        },
        createur: {
          select: {
            id: true,
            prenom: true,
            nom: true,
            role: true,
            email: true,
          },
        },
      },
    });

    // 7. Journalisation (audit interne)
    await this.prisma.journalAudit.create({
      data: {
        utilisateurId,
        action: `Changement de statut d’un événement (${nouveauStatut})`,
        typeCible: 'EvenementCalendrier',
        cibleId: id,
        ancienneValeur,
        nouvelleValeur: updated,
      },
    });

    return updated;
  }
  // 🗑️ DELETE /events/:id — Soft delete
  async softDelete(id: string, utilisateurId: string) {
    // 1️⃣ Vérifier l'existence de l'événement
    const evenement = await this.prisma.evenementCalendrier.findUnique({
      where: { id },
    });

    if (!evenement || evenement.statut === 'SUPPRIME') {
      throw new NotFoundException(`Événement introuvable ou déjà supprimé`);
    }

    // 2️⃣ Vérifier que l'utilisateur existe
    const utilisateur = await this.prisma.utilisateur.findUnique({
      where: { id: utilisateurId },
    });

    if (!utilisateur) {
      throw new NotFoundException(`Utilisateur introuvable`);
    }

    // 3️⃣ Vérifier les droits (créateur ou admin)
    if (evenement.creeParId !== utilisateurId && utilisateur.role !== 'ADMIN') {
      throw new BadRequestException(
        `Vous n'avez pas le droit de supprimer cet événement`,
      );
    }

    // 4️⃣ Sauvegarder l’ancienne valeur pour audit
    const ancienneValeur = { ...evenement };

    // 5️⃣ Mettre à jour le statut en "SUPPRIME"
    const supprime = await this.prisma.evenementCalendrier.update({
      where: { id },
      data: { statut: 'SUPPRIME' },
      include: {
        dossier: {
          select: { id: true, titre: true, numeroUnique: true, type: true },
        },
        createur: {
          select: {
            id: true,
            prenom: true,
            nom: true,
            role: true,
            email: true,
          },
        },
      },
    });

    // 6️⃣ Journaliser la suppression
    await this.prisma.journalAudit.create({
      data: {
        utilisateurId,
        action: `Suppression (soft delete) d’un événement`,
        typeCible: 'EvenementCalendrier',
        cibleId: id,
        ancienneValeur,
        nouvelleValeur: supprime,
      },
    });

    // 7️⃣ Retourner une réponse claire
    return {
      message: `Événement supprimé avec succès`,
      evenement: supprime,
    };
  }
}
