/* eslint-disable @typescript-eslint/no-unsafe-return */
// src/dashboard/dashboard.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { RoleUtilisateur } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async getDashboardData(utilisateurId: string, role: RoleUtilisateur) {
    const cacheKey = `dashboard:${utilisateurId}:${role}`;
    const cachedData = await this.cacheManager.get(cacheKey);
    if (cachedData) return cachedData;

    let dashboardData;

    switch (role) {
      case RoleUtilisateur.ADMIN:
      case RoleUtilisateur.DG:
        dashboardData = await this.getAdminDashboard();
        break;
      case RoleUtilisateur.AVOCAT:
        dashboardData = await this.getAvocatDashboard(utilisateurId);
        break;
      case RoleUtilisateur.SECRETAIRE:
      case RoleUtilisateur.ASSISTANT:
        dashboardData = await this.getAssistantDashboard(utilisateurId);
        break;
      case RoleUtilisateur.JURISTE:
        dashboardData = await this.getJuristeDashboard(utilisateurId);
        break;
      case RoleUtilisateur.STAGIAIRE:
        dashboardData = await this.getStagiaireDashboard(utilisateurId);
        break;
      default:
        dashboardData = await this.getBasicDashboard(utilisateurId);
    }

    await this.cacheManager.set(cacheKey, dashboardData, 300); // Cache pour 5 minutes
    return dashboardData;
  }

  private async getAdminDashboard() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const [
      statsDossiers,
      statsFactures,
      statsClients,
      statsUtilisateurs,
      chiffreAffairesMois,
      chiffreAffairesAnnee,
      dossiersParType,
      performancesAvocats,
      alertesRecentes,
    ] = await Promise.all([
      // Statistiques des dossiers
      this.prisma.dossier.groupBy({
        by: ['statut'],
        _count: true,
      }),
      // Statistiques des factures
      this.prisma.facture.groupBy({
        by: ['statut'],
        _count: true,
        _sum: { montantTotal: true },
      }),
      // Statistiques des clients
      this.prisma.client.count({
        where: { statut: 'ACTIF' },
      }),
      // Statistiques des utilisateurs
      this.prisma.utilisateur.count({
        where: { statut: 'ACTIF' },
      }),
      // Chiffre d'affaires du mois
      this.prisma.facture.aggregate({
        _sum: { montantTotal: true },
        where: {
          dateEmission: { gte: startOfMonth },
          statut: { in: ['PAYEE', 'PARTIELLE'] },
        },
      }),
      // Chiffre d'affaires de l'année
      this.prisma.facture.aggregate({
        _sum: { montantTotal: true },
        where: {
          dateEmission: { gte: startOfYear },
          statut: { in: ['PAYEE', 'PARTIELLE'] },
        },
      }),
      // Dossiers par type
      this.prisma.dossier.groupBy({
        by: ['type'],
        _count: true,
      }),
      // Performance des avocats
      this.prisma.performanceAvocat.findMany({
        take: 10,
        orderBy: { chiffreAffaires: 'desc' },
        include: {
          avocat: {
            select: { id: true, prenom: true, nom: true },
          },
        },
      }),
      // Alertes récentes
      this.prisma.alerte.findMany({
        take: 10,
        orderBy: { creeLe: 'desc' },
        where: { traite: false },
      }),
    ]);

    return {
      stats: {
        dossiers: statsDossiers.reduce((acc, item) => {
          acc[item.statut] = item._count;
          return acc;
        }, {}),
        factures: statsFactures.reduce((acc, item) => {
          acc[item.statut] = {
            count: item._count,
            montant: Number(item._sum.montantTotal || 0),
          };
          return acc;
        }, {}),
        clients: statsClients,
        utilisateurs: statsUtilisateurs,
      },
      chiffreAffaires: {
        mois: Number(chiffreAffairesMois._sum.montantTotal || 0),
        annee: Number(chiffreAffairesAnnee._sum.montantTotal || 0),
      },
      dossiersParType: dossiersParType.reduce((acc, item) => {
        acc[item.type] = item._count;
        return acc;
      }, {}),
      performancesAvocats,
      alertesRecentes,
    };
  }

  private async getAvocatDashboard(utilisateurId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const [
      mesDossiers,
      tachesEnCours,
      evenementsAvenir,
      facturesEnAttente,
      chiffreAffairesMois,
      chiffreAffairesAnnee,
      dossiersProchesEcheance,
      alertes,
    ] = await Promise.all([
      // Mes dossiers
      this.prisma.dossier.groupBy({
        by: ['statut'],
        _count: true,
        where: { responsableId: utilisateurId },
      }),
      // Tâches en cours
      this.prisma.tache.count({
        where: {
          assigneeId: utilisateurId,
          statut: { in: ['A_FAIRE', 'EN_COURS'] },
        },
      }),
      // Événements à venir
      this.prisma.evenementCalendrier.findMany({
        take: 5,
        where: {
          creeParId: utilisateurId,
          debut: { gte: now },
          statut: 'PREVU',
        },
        orderBy: { debut: 'asc' },
      }),
      // Factures en attente de paiement
      this.prisma.facture.findMany({
        take: 5,
        where: {
          statut: { in: ['IMPAYEE', 'EN_RETARD'] },
        },
        include: {
          client: {
            select: { id: true, prenom: true, nom: true, entreprise: true },
          },
        },
        orderBy: { dateEcheance: 'asc' },
      }),
      // Chiffre d'affaires du mois
      this.prisma.facture.aggregate({
        _sum: { montantTotal: true },
        where: {
          dateEmission: { gte: startOfMonth },
          statut: { in: ['PAYEE', 'PARTIELLE'] },
        },
      }),
      // Chiffre d'affaires de l'année
      this.prisma.facture.aggregate({
        _sum: { montantTotal: true },
        where: {
          dateEmission: { gte: startOfYear },
          statut: { in: ['PAYEE', 'PARTIELLE'] },
        },
      }),
      // Dossiers avec échéances proches
      this.prisma.dossier.findMany({
        take: 5,
        where: {
          responsableId: utilisateurId,
          procedures: {
            some: {
              etapes: {
                some: {
                  dateFin: {
                    lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
                  }, // 7 jours
                  statut: { in: ['EN_ATTENTE', 'EN_COURS'] },
                },
              },
            },
          },
        },
        include: {
          client: {
            select: { id: true, prenom: true, nom: true, entreprise: true },
          },
        },
      }),
      // Alertes
      this.prisma.alerte.findMany({
        take: 5,
        where: {
          utilisateurId,
          traite: false,
        },
        orderBy: { priorite: 'desc' },
      }),
    ]);

    return {
      stats: {
        dossiers: mesDossiers.reduce((acc, item) => {
          acc[item.statut] = item._count;
          return acc;
        }, {}),
        tachesEnCours,
      },
      chiffreAffaires: {
        mois: Number(chiffreAffairesMois._sum.montantTotal || 0),
        annee: Number(chiffreAffairesAnnee._sum.montantTotal || 0),
      },
      evenementsAvenir,
      facturesEnAttente,
      dossiersProchesEcheance,
      alertes,
    };
  }

  private async getAssistantDashboard(utilisateurId: string) {
    const now = new Date();

    const [
      tachesAssignees,
      evenementsAvenir,
      dossiersRecentes,
      facturesRecentes,
      correspondancesEnAttente,
      alertes,
    ] = await Promise.all([
      // Tâches assignées
      this.prisma.tache.findMany({
        take: 10,
        where: {
          assigneeId: utilisateurId,
          statut: { in: ['A_FAIRE', 'EN_COURS'] },
        },
        orderBy: { priorite: 'desc' },
        include: {
          dossier: {
            select: { id: true, numeroUnique: true, titre: true },
          },
        },
      }),
      // Événements à venir
      this.prisma.evenementCalendrier.findMany({
        take: 5,
        where: {
          debut: { gte: now },
          statut: 'PREVU',
        },
        orderBy: { debut: 'asc' },
      }),
      // Dossiers récemment modifiés
      this.prisma.dossier.findMany({
        take: 5,
        orderBy: { modifieLe: 'desc' },
        include: {
          client: {
            select: { id: true, prenom: true, nom: true, entreprise: true },
          },
          responsable: {
            select: { id: true, prenom: true, nom: true },
          },
        },
      }),
      // Factures récentes
      this.prisma.facture.findMany({
        take: 5,
        orderBy: { creeLe: 'desc' },
        include: {
          client: {
            select: { id: true, prenom: true, nom: true, entreprise: true },
          },
        },
      }),
      // Correspondances en attente
      this.prisma.correspondance.findMany({
        take: 5,
        where: { statut: 'ACTIF' },
        orderBy: { creeLe: 'desc' },
        include: {
          client: {
            select: { id: true, prenom: true, nom: true, entreprise: true },
          },
        },
      }),
      // Alertes
      this.prisma.alerte.findMany({
        take: 5,
        where: {
          utilisateurId,
          traite: false,
        },
        orderBy: { priorite: 'desc' },
      }),
    ]);

    return {
      tachesAssignees,
      evenementsAvenir,
      dossiersRecentes,
      facturesRecentes,
      correspondancesEnAttente,
      alertes,
    };
  }

  private async getJuristeDashboard(utilisateurId: string) {
    const now = new Date();

    const [
      proceduresEnCours,
      audiencesAvenir,
      jurisprudencesRecentes,
      dossiersAssignes,
      alertes,
    ] = await Promise.all([
      // Procédures en cours
      this.prisma.procedure.findMany({
        take: 10,
        where: {
          statut: 'EN_COURS',
          dossier: {
            responsableId: utilisateurId,
          },
        },
        orderBy: { modifieLe: 'desc' },
        include: {
          dossier: {
            select: { id: true, numeroUnique: true, titre: true },
          },
          etapes: {
            where: { statut: { in: ['EN_ATTENTE', 'EN_COURS'] } },
            orderBy: { dateDebut: 'desc' },
            take: 1,
          },
        },
      }),
      // Audiences à venir
      this.prisma.audience.findMany({
        take: 5,
        where: {
          dateAudience: { gte: now },
          statut: 'PREVUE',
          procedure: {
            dossier: {
              responsableId: utilisateurId,
            },
          },
        },
        orderBy: { dateAudience: 'asc' },
        include: {
          procedure: {
            select: { id: true, typeProcedure: true },
          },
        },
      }),
      // Jurisprudences récentes
      this.prisma.jurisprudence.findMany({
        take: 5,
        orderBy: { creeLe: 'desc' },
      }),
      // Dossiers assignés
      this.prisma.dossier.findMany({
        take: 5,
        where: { responsableId: utilisateurId },
        orderBy: { modifieLe: 'desc' },
        include: {
          client: {
            select: { id: true, prenom: true, nom: true, entreprise: true },
          },
        },
      }),
      // Alertes
      this.prisma.alerte.findMany({
        take: 5,
        where: {
          utilisateurId,
          traite: false,
        },
        orderBy: { priorite: 'desc' },
      }),
    ]);

    return {
      proceduresEnCours,
      audiencesAvenir,
      jurisprudencesRecentes,
      dossiersAssignes,
      alertes,
    };
  }

  private async getStagiaireDashboard(utilisateurId: string) {
    const now = new Date();

    const [
      tachesAssignees,
      dossiersAssignes,
      evenementsAvenir,
      documentsRecentes,
      alertes,
    ] = await Promise.all([
      // Tâches assignées
      this.prisma.tache.findMany({
        take: 10,
        where: {
          assigneeId: utilisateurId,
          statut: { in: ['A_FAIRE', 'EN_COURS'] },
        },
        orderBy: { priorite: 'desc' },
        include: {
          dossier: {
            select: { id: true, numeroUnique: true, titre: true },
          },
        },
      }),
      // Dossiers assignés
      this.prisma.dossier.findMany({
        take: 5,
        where: { responsableId: utilisateurId },
        orderBy: { modifieLe: 'desc' },
        include: {
          client: {
            select: { id: true, prenom: true, nom: true, entreprise: true },
          },
        },
      }),
      // Événements à venir
      this.prisma.evenementCalendrier.findMany({
        take: 5,
        where: {
          debut: { gte: now },
          statut: 'PREVU',
        },
        orderBy: { debut: 'asc' },
      }),
      // Documents récents
      this.prisma.document.findMany({
        take: 5,
        orderBy: { creeLe: 'desc' },
        include: {
          dossier: {
            select: { id: true, numeroUnique: true, titre: true },
          },
        },
      }),
      // Alertes
      this.prisma.alerte.findMany({
        take: 5,
        where: {
          utilisateurId,
          traite: false,
        },
        orderBy: { priorite: 'desc' },
      }),
    ]);

    return {
      tachesAssignees,
      dossiersAssignes,
      evenementsAvenir,
      documentsRecentes,
      alertes,
    };
  }

  private async getBasicDashboard(utilisateurId: string) {
    const [tachesAssignees, evenementsAvenir, alertes] = await Promise.all([
      // Tâches assignées
      this.prisma.tache.findMany({
        take: 10,
        where: {
          assigneeId: utilisateurId,
          statut: { in: ['A_FAIRE', 'EN_COURS'] },
        },
        orderBy: { priorite: 'desc' },
        include: {
          dossier: {
            select: { id: true, numeroUnique: true, titre: true },
          },
        },
      }),
      // Événements à venir
      this.prisma.evenementCalendrier.findMany({
        take: 5,
        where: {
          debut: { gte: new Date() },
          statut: 'PREVU',
        },
        orderBy: { debut: 'asc' },
      }),
      // Alertes
      this.prisma.alerte.findMany({
        take: 5,
        where: {
          utilisateurId,
          traite: false,
        },
        orderBy: { priorite: 'desc' },
      }),
    ]);

    return {
      tachesAssignees,
      evenementsAvenir,
      alertes,
    };
  }

  async invalidateDashboardCache(
    utilisateurId: string,
    role: RoleUtilisateur,
  ): Promise<void> {
    const cacheKey = `dashboard:${utilisateurId}:${role}`;
    await this.cacheManager.del(cacheKey);
  }
}
