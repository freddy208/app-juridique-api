import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { FilterUsersDto } from './dto/filter-users.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { UpdateUserDto } from './dto/update-user.dto';

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

  async create(data: CreateUserDto) {
    const existing = await this.prisma.utilisateur.findUnique({
      where: { email: data.email },
    });
    if (existing) {
      throw new ConflictException(`Email ${data.email} déjà utilisé`);
    }

    const hashedPassword = await bcrypt.hash(data.motDePasse, 10);

    return await this.prisma.utilisateur.create({
      data: {
        prenom: data.prenom,
        nom: data.nom,
        email: data.email,
        motDePasse: hashedPassword,
        role: data.role ?? undefined,
        statut: data.statut ?? undefined,
      },
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
  }
  // ... findAll, findOne, create existants

  async update(id: string, data: UpdateUserDto) {
    const user = await this.prisma.utilisateur.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`Collaborateur avec id ${id} introuvable`);
    }

    // Vérifier si email existe déjà (autre que celui qu’on modifie)
    if (data.email && data.email !== user.email) {
      const existing = await this.prisma.utilisateur.findUnique({
        where: { email: data.email },
      });
      if (existing) {
        throw new ConflictException(`Email ${data.email} déjà utilisé`);
      }
    }

    // Si motDePasse présent, hasher
    if (data.motDePasse) {
      data.motDePasse = await bcrypt.hash(data.motDePasse, 10);
    }

    return this.prisma.utilisateur.update({
      where: { id },
      data,
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
  }
  async updateStatus(id: string, statut: 'ACTIF' | 'INACTIF') {
    const user = await this.prisma.utilisateur.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException(`Collaborateur avec id ${id} introuvable`);
    }

    // Si le statut est déjà le même, on peut soit renvoyer l'utilisateur, soit lancer un conflit
    if (user.statut === statut) {
      throw new ConflictException(
        `Le collaborateur est déjà ${statut === 'ACTIF' ? 'activé' : 'désactivé'}`,
      );
    }

    return this.prisma.utilisateur.update({
      where: { id },
      data: { statut },
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
  }
  async softDelete(id: string) {
    const user = await this.prisma.utilisateur.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException(`Collaborateur avec id ${id} introuvable`);
    }

    if (user.statut === 'INACTIF') {
      throw new ConflictException(`Le collaborateur est déjà désactivé`);
    }

    return this.prisma.utilisateur.update({
      where: { id },
      data: { statut: 'INACTIF' },
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
  }
}
