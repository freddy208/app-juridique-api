// src/utilisateurs/utilisateurs.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { FilterUsersDto } from './dto/filter-users.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class UtilisateursService {
  constructor(private prisma: PrismaService) {}

  async findAll(filter?: FilterUsersDto) {
    const where: Prisma.UtilisateurWhereInput = {};

    if (filter?.role) {
      where.role = filter.role;
    }

    if (filter?.statut) {
      where.statut = filter.statut;
    }

    return this.prisma.utilisateur.findMany({
      where,
      select: {
        id: true,
        prenom: true,
        nom: true,
        email: true,
        role: true,
        statut: true,
        creeLe: true,
        modifieLe: true,
      },
      orderBy: { creeLe: 'desc' },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.utilisateur.findUnique({
      where: { id },
      select: {
        id: true,
        prenom: true,
        nom: true,
        email: true,
        role: true,
        statut: true,
        creeLe: true,
        modifieLe: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`Collaborateur avec id ${id} introuvable`);
    }

    return user;
  }
}
