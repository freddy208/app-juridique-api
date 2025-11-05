/* eslint-disable @typescript-eslint/await-thenable */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
// src/statistiques/statistiques.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { RoleUtilisateur, StatutFacture } from '@prisma/client';

@Injectable()
export class StatistiquesService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async getStatistiquesGenerales(period?: string) {
    const cacheKey = `statistiques-generales:${period || 'all'}`;
    const cachedData = await this.cacheManager.get(cacheKey);
    if (cachedData) return cachedData;

    const now = new Date();
    let dateDebut: Date;

    // Définir la période en fonction du paramètre
    switch (period) {
      case 'mois':
        dateDebut = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'trimestre': {
        const trimestre = Math.floor(now.getMonth() / 3);
        dateDebut = new Date(now.getFullYear(), trimestre * 3, 1);
        break;
      }
      case 'annee':
        dateDebut = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        dateDebut = new Date(0); // Depuis le début
    }

    const [
      statsDossiers,
      statsFactures,
      statsHonoraires,
      statsDepenses,
      statsClients,
      statsUtilisateurs,
      chiffreAffairesParMois,
      dossiersParType,
      dossiersParStatut,
      honorairesParType,
      depensesParCategorie,
      performanceAvocats,
      statistiquesProcedures,
      statsJuridictions,
      statsMatiereDroit,
      statsSensDecision,
    ] = await Promise.all([
      // Statistiques des dossiers
      this.prisma.dossier.groupBy({
        by: ['statut', 'type'],
        _count: true,
        where: {
          creeLe: { gte: dateDebut },
        },
      }),
      // Statistiques des factures
      this.prisma.facture.groupBy({
        by: ['statut'],
        _count: true,
        _sum: { montantTotal: true },
        where: {
          dateEmission: { gte: dateDebut },
        },
      }),
      // Statistiques des honoraires
      this.prisma.honoraire.groupBy({
        by: ['typeHonoraire', 'statut'],
        _count: true,
        _sum: { montantTTC: true },
        where: {
          dateEmission: { gte: dateDebut },
        },
      }),
      // Statistiques des dépenses
      this.prisma.depense.groupBy({
        by: ['categorie'],
        _count: true,
        _sum: { montant: true },
        where: {
          dateDepense: { gte: dateDebut },
        },
      }),
      // Statistiques des clients
      this.prisma.client.groupBy({
        by: ['typeClient', 'statut'],
        _count: true,
        where: {
          creeLe: { gte: dateDebut },
        },
      }),
      // Statistiques des utilisateurs
      this.prisma.utilisateur.groupBy({
        by: ['role', 'statut'],
        _count: true,
      }),
      // Chiffre d'affaires par mois
      this.prisma.$queryRaw`
        SELECT 
          TO_CHAR("dateEmission", 'YYYY-MM') as mois,
          SUM("montantTotal") as montant
        FROM "Facture" 
        WHERE "dateEmission" >= ${dateDebut}
        GROUP BY TO_CHAR("dateEmission", 'YYYY-MM')
        ORDER BY mois DESC
      ` as unknown as { mois: string; montant: bigint }[],
      // Dossiers par type
      this.prisma.dossier.groupBy({
        by: ['type'],
        _count: true,
        where: {
          creeLe: { gte: dateDebut },
        },
      }),
      // Dossiers par statut
      this.prisma.dossier.groupBy({
        by: ['statut'],
        _count: true,
        where: {
          creeLe: { gte: dateDebut },
        },
      }),
      // Honoraires par type
      this.prisma.honoraire.groupBy({
        by: ['typeHonoraire'],
        _count: true,
        _sum: { montantTTC: true },
        where: {
          dateEmission: { gte: dateDebut },
        },
      }),
      // Dépenses par catégorie
      this.prisma.depense.groupBy({
        by: ['categorie'],
        _count: true,
        _sum: { montant: true },
        where: {
          dateDepense: { gte: dateDebut },
        },
      }),
      // Performance des avocats
      this.prisma.performanceAvocat.findMany({
        where: {
          mois: { gte: dateDebut },
        },
        include: {
          avocat: {
            select: { id: true, prenom: true, nom: true },
          },
        },
        orderBy: { mois: 'desc' },
      }),
      // Statistiques des procédures
      this.prisma.procedure.groupBy({
        by: ['typeProcedure', 'statut'],
        _count: true,
        where: {
          dateIntroduction: { gte: dateDebut },
        },
      }),
      // Statistiques des juridictions
      this.prisma.procedure.groupBy({
        by: ['juridiction'],
        _count: true,
        where: {
          dateIntroduction: { gte: dateDebut },
        },
      }),
      // Statistiques des matières de droit
      this.prisma.jurisprudence.groupBy({
        by: ['matiere'],
        _count: true,
        where: {
          dateDecision: { gte: dateDebut },
        },
      }),
      // Statistiques des sens de décision
      this.prisma.jurisprudence.groupBy({
        by: ['sensDecision'],
        _count: true,
        where: {
          dateDecision: { gte: dateDebut },
        },
      }),
    ]);

    // Calcul des totaux et pourcentages
    const totalDossiers = statsDossiers.reduce(
      (sum, item) => sum + item._count,
      0,
    );
    const totalFactures = statsFactures.reduce(
      (sum, item) => sum + item._count,
      0,
    );
    const totalFacturesPayees = statsFactures
      .filter((item) => item.statut === StatutFacture.PAYEE)
      .reduce((sum, item) => sum + item._count, 0);
    const totalMontantFactures = Number(
      statsFactures.reduce(
        (sum, item) => sum + Number(item._sum.montantTotal || 0),
        0,
      ),
    );
    const totalMontantFacturesPayees = Number(
      statsFactures
        .filter((item) => item.statut === StatutFacture.PAYEE)
        .reduce((sum, item) => sum + Number(item._sum.montantTotal || 0), 0),
    );
    const totalHonoraires = Number(
      statsHonoraires.reduce(
        (sum, item) => sum + Number(item._sum.montantTTC || 0),
        0,
      ),
    );
    const totalDepenses = Number(
      statsDepenses.reduce(
        (sum, item) => sum + Number(item._sum.montant || 0),
        0,
      ),
    );
    const totalClients = statsClients.reduce(
      (sum, item) => sum + item._count,
      0,
    );
    const totalClientsActifs = statsClients
      .filter((item) => item.statut === 'ACTIF')
      .reduce((sum, item) => sum + item._count, 0);
    const totalUtilisateurs = statsUtilisateurs.reduce(
      (sum, item) => sum + item._count,
      0,
    );
    const totalAvocats = statsUtilisateurs
      .filter((item) => item.role === RoleUtilisateur.AVOCAT)
      .reduce((sum, item) => sum + item._count, 0);

    // Taux de recouvrement
    const tauxRecouvrement =
      totalMontantFactures > 0
        ? (totalMontantFacturesPayees / totalMontantFactures) * 100
        : 0;

    // Marge bénéficiaire
    const margeBeneficiaire =
      totalHonoraires > 0
        ? ((totalHonoraires - totalDepenses) / totalHonoraires) * 100
        : 0;

    // Formatage des données
    const chiffreAffairesParMoisFormate = chiffreAffairesParMois.map(
      (item) => ({
        mois: item.mois,
        montant: Number(item.montant),
      }),
    );

    const dossiersParTypeFormate = dossiersParType.reduce(
      (acc, item) => {
        acc[item.type] = item._count;
        return acc;
      },
      {} as Record<string, number>,
    );

    const dossiersParStatutFormate = dossiersParStatut.reduce(
      (acc, item) => {
        acc[item.statut] = item._count;
        return acc;
      },
      {} as Record<string, number>,
    );

    const honorairesParTypeFormate = honorairesParType.reduce(
      (acc, item) => {
        acc[item.typeHonoraire] = {
          count: item._count,
          montant: Number(item._sum.montantTTC || 0),
        };
        return acc;
      },
      {} as Record<string, { count: number; montant: number }>,
    );

    const depensesParCategorieFormate = depensesParCategorie.reduce(
      (acc, item) => {
        acc[item.categorie] = {
          count: item._count,
          montant: Number(item._sum.montant || 0),
        };
        return acc;
      },
      {} as Record<string, { count: number; montant: number }>,
    );

    const statistiquesProceduresFormate = statistiquesProcedures.reduce(
      (acc, item) => {
        if (!acc[item.typeProcedure]) {
          acc[item.typeProcedure] = {};
        }
        acc[item.typeProcedure][item.statut] = item._count;
        return acc;
      },
      {} as Record<string, Record<string, number>>,
    );

    const statsJuridictionsFormate = statsJuridictions.reduce(
      (acc, item) => {
        acc[item.juridiction] = item._count;
        return acc;
      },
      {} as Record<string, number>,
    );

    const statsMatiereDroitFormate = statsMatiereDroit.reduce(
      (acc, item) => {
        acc[item.matiere] = item._count;
        return acc;
      },
      {} as Record<string, number>,
    );

    const statsSensDecisionFormate = statsSensDecision.reduce(
      (acc, item) => {
        acc[item.sensDecision] = item._count;
        return acc;
      },
      {} as Record<string, number>,
    );

    const result = {
      periode: period || 'all',
      dateDebut,
      dateFin: now,
      resume: {
        totalDossiers,
        totalFactures,
        totalFacturesPayees,
        totalMontantFactures,
        totalMontantFacturesPayees,
        totalHonoraires,
        totalDepenses,
        totalClients,
        totalClientsActifs,
        totalUtilisateurs,
        totalAvocats,
        tauxRecouvrement,
        margeBeneficiaire,
      },
      dossiers: {
        parType: dossiersParTypeFormate,
        parStatut: dossiersParStatutFormate,
      },
      factures: {
        parStatut: statsFactures.reduce(
          (acc, item) => {
            acc[item.statut] = {
              count: item._count,
              montant: Number(item._sum.montantTotal || 0),
            };
            return acc;
          },
          {} as Record<string, { count: number; montant: number }>,
        ),
      },
      honoraires: {
        parType: honorairesParTypeFormate,
        parStatut: statsHonoraires.reduce(
          (acc, item) => {
            if (!acc[item.typeHonoraire]) {
              acc[item.typeHonoraire] = {};
            }
            acc[item.typeHonoraire][item.statut] = {
              count: item._count,
              montant: Number(item._sum.montantTTC || 0),
            };
            return acc;
          },
          {} as Record<
            string,
            Record<string, { count: number; montant: number }>
          >,
        ),
      },
      depenses: {
        parCategorie: depensesParCategorieFormate,
      },
      clients: {
        parType: statsClients.reduce(
          (acc, item) => {
            if (!acc[item.typeClient]) {
              acc[item.typeClient] = {};
            }
            acc[item.typeClient][item.statut] = item._count;
            return acc;
          },
          {} as Record<string, Record<string, number>>,
        ),
      },
      utilisateurs: {
        parRole: statsUtilisateurs.reduce(
          (acc, item) => {
            if (!acc[item.role]) {
              acc[item.role] = {};
            }
            acc[item.role][item.statut] = item._count;
            return acc;
          },
          {} as Record<string, Record<string, number>>,
        ),
      },
      chiffreAffaires: {
        parMois: chiffreAffairesParMoisFormate,
      },
      procedures: {
        parType: statistiquesProceduresFormate,
        parJuridiction: statsJuridictionsFormate,
      },
      jurisprudence: {
        parMatiere: statsMatiereDroitFormate,
        parSensDecision: statsSensDecisionFormate,
      },
      performanceAvocats,
    };

    await this.cacheManager.set(cacheKey, result, 600); // Cache pour 10 minutes
    return result;
  }

  async getPerformanceAvocats(period?: string, avocatId?: string) {
    const cacheKey = `performance-avocats:${period || 'all'}:${avocatId || 'all'}`;
    const cachedData = await this.cacheManager.get(cacheKey);
    if (cachedData) return cachedData;

    const now = new Date();
    let dateDebut: Date;

    // Définir la période en fonction du paramètre
    switch (period) {
      case 'mois':
        dateDebut = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'trimestre': {
        const trimestre = Math.floor(now.getMonth() / 3);
        dateDebut = new Date(now.getFullYear(), trimestre * 3, 1);
        break;
      }
      case 'annee':
        dateDebut = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        dateDebut = new Date(0); // Depuis le début
    }

    // Filtre pour un avocat spécifique si fourni
    const whereAvocat = avocatId ? { avocatId } : {};

    const [
      performances,
      dossiersParAvocat,
      chiffreAffairesParAvocat,
      tauxVictoireParAvocat,
      delaiMoyenParAvocat,
    ] = await Promise.all([
      // Données de performance enregistrées
      this.prisma.performanceAvocat.findMany({
        where: {
          ...whereAvocat,
          mois: { gte: dateDebut },
        },
        include: {
          avocat: {
            select: { id: true, prenom: true, nom: true, specialite: true },
          },
        },
        orderBy: { mois: 'desc' },
      }),
      // Nombre de dossiers par avocat
      this.prisma.dossier.groupBy({
        by: ['responsableId'],
        _count: true,
        where: {
          ...whereAvocat,
          creeLe: { gte: dateDebut },
        },
      }),
      // Chiffre d'affaires par avocat
      this.prisma.$queryRaw`
        SELECT 
          d."responsableId" as "avocatId",
          SUM(f."montantTotal") as "chiffreAffaires"
        FROM "Dossier" d
        JOIN "Facture" f ON d.id = f."dossierId"
        WHERE d."creeLe" >= ${dateDebut}
        ${avocatId ? `AND d."responsableId" = ${avocatId}` : ''}
        GROUP BY d."responsableId"
      ` as unknown as { avocatId: string; chiffreAffaires: bigint }[],
      // Taux de victoire par avocat
      this.prisma.$queryRaw`
        SELECT 
          d."responsableId" as "avocatId",
          COUNT(CASE WHEN j."sensDecision" = 'FAVORABLE' THEN 1 END) as "victoires",
          COUNT(j.id) as "total"
        FROM "Dossier" d
        JOIN "DossierJurisprudence" dj ON d.id = dj."dossierId"
        JOIN "Jurisprudence" j ON dj."jurisprudenceId" = j.id
        WHERE d."creeLe" >= ${dateDebut}
        ${avocatId ? `AND d."responsableId" = ${avocatId}` : ''}
        GROUP BY d."responsableId"
      ` as unknown as { avocatId: string; victoires: bigint; total: bigint }[],
      // Délai moyen de traitement par avocat
      this.prisma.$queryRaw`
        SELECT 
          d."responsableId" as "avocatId",
          AVG(EXTRACT(EPOCH FROM (d."modifieLe" - d."creeLe"))/86400) as "delaiMoyen"
        FROM "Dossier" d
        WHERE d."creeLe" >= ${dateDebut}
        AND d."statut" = 'CLOS'
        ${avocatId ? `AND d."responsableId" = ${avocatId}` : ''}
        GROUP BY d."responsableId"
      ` as unknown as { avocatId: string; delaiMoyen: number }[],
    ]);

    // Récupérer les informations des avocats
    // Récupérer les informations des avocats
    const avocatsIdsSet = new Set<string>();
    [
      ...performances.map((p) => p.avocatId),
      ...dossiersParAvocat.map((d) => d.responsableId),
      ...chiffreAffairesParAvocat.map((c) => c.avocatId),
      ...tauxVictoireParAvocat.map((t) => t.avocatId),
      ...delaiMoyenParAvocat.map((d) => d.avocatId),
    ].forEach((id) => {
      if (id !== null) {
        avocatsIdsSet.add(id);
      }
    });

    const avocatsIds = Array.from(avocatsIdsSet);

    const avocats = await this.prisma.utilisateur.findMany({
      where: {
        id: { in: avocatsIds },
        role: RoleUtilisateur.AVOCAT,
      },
      select: {
        id: true,
        prenom: true,
        nom: true,
        specialite: true,
        barreau: true,
      },
    });

    // Fusionner toutes les données par avocat
    const result = avocats.map((avocat) => {
      const performancesAvocat = performances.filter(
        (p) => p.avocatId === avocat.id,
      );
      const dossiersAvocat =
        dossiersParAvocat.find((d) => d.responsableId === avocat.id)?._count ||
        0;
      const chiffreAffairesAvocat = Number(
        chiffreAffairesParAvocat.find((c) => c.avocatId === avocat.id)
          ?.chiffreAffaires || 0,
      );
      const tauxVictoireAvocat = tauxVictoireParAvocat.find(
        (t) => t.avocatId === avocat.id,
      );
      const delaiMoyenAvocat =
        delaiMoyenParAvocat.find((d) => d.avocatId === avocat.id)?.delaiMoyen ||
        0;

      // Calculer le taux de victoire
      const tauxVictoire =
        tauxVictoireAvocat && Number(tauxVictoireAvocat.total) > 0
          ? (Number(tauxVictoireAvocat.victoires) /
              Number(tauxVictoireAvocat.total)) *
            100
          : 0;

      // Agréger les performances par mois
      const performancesParMois = performancesAvocat.reduce(
        (acc, perf) => {
          const mois = new Date(perf.mois).toISOString().slice(0, 7); // YYYY-MM
          if (!acc[mois]) {
            acc[mois] = {
              nombreDossiers: 0,
              chiffreAffaires: 0,
              tauxVictoire: 0,
              delaiMoyen: 0,
            };
          }
          acc[mois].nombreDossiers += perf.nombreDossiers;
          acc[mois].chiffreAffaires += Number(perf.chiffreAffaires);
          acc[mois].tauxVictoire = perf.tauxVictoire
            ? Number(perf.tauxVictoire)
            : 0;
          acc[mois].delaiMoyen = perf.delaiMoyen ? Number(perf.delaiMoyen) : 0;
          return acc;
        },
        {} as Record<
          string,
          {
            nombreDossiers: number;
            chiffreAffaires: number;
            tauxVictoire: number;
            delaiMoyen: number;
          }
        >,
      );

      return {
        avocat,
        stats: {
          nombreDossiers: dossiersAvocat,
          chiffreAffaires: chiffreAffairesAvocat,
          tauxVictoire,
          delaiMoyen: Math.round(delaiMoyenAvocat * 10) / 10, // Arrondi à 1 décimale
        },
        performancesParMois,
        performancesHistoriques: performancesAvocat,
      };
    });

    // Trier par chiffre d'affaires décroissant
    result.sort((a, b) => b.stats.chiffreAffaires - a.stats.chiffreAffaires);

    await this.cacheManager.set(cacheKey, result, 600); // Cache pour 10 minutes
    return result;
  }

  async getStatistiquesFinancieres(period?: string) {
    const cacheKey = `statistiques-financieres:${period || 'all'}`;
    const cachedData = await this.cacheManager.get(cacheKey);
    if (cachedData) return cachedData;

    const now = new Date();
    let dateDebut: Date;

    // Définir la période en fonction du paramètre
    switch (period) {
      case 'mois':
        dateDebut = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'trimestre': {
        const trimestre = Math.floor(now.getMonth() / 3);
        dateDebut = new Date(now.getFullYear(), trimestre * 3, 1);
        break;
      }
      case 'annee':
        dateDebut = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        dateDebut = new Date(0); // Depuis le début
    }

    const [
      facturesParMois,
      honorairesParMois,
      depensesParMois,
      paiementsParMois,
      provisionsParMois,
      facturesParStatut,
      honorairesParType,
      depensesParCategorie,
      modePaiement,
      recouvrementParAvocat,
    ] = await Promise.all([
      // Factures par mois
      this.prisma.$queryRaw`
        SELECT 
          TO_CHAR("dateEmission", 'YYYY-MM') as mois,
          SUM("montantTotal") as montant,
          COUNT(*) as nombre
        FROM "Facture" 
        WHERE "dateEmission" >= ${dateDebut}
        GROUP BY TO_CHAR("dateEmission", 'YYYY-MM')
        ORDER BY mois DESC
      ` as unknown as { mois: string; montant: bigint; nombre: number }[],
      // Honoraires par mois
      this.prisma.$queryRaw`
        SELECT 
          TO_CHAR("dateEmission", 'YYYY-MM') as mois,
          SUM("montantTTC") as montant,
          COUNT(*) as nombre
        FROM "Honoraire" 
        WHERE "dateEmission" >= ${dateDebut}
        GROUP BY TO_CHAR("dateEmission", 'YYYY-MM')
        ORDER BY mois DESC
      ` as unknown as { mois: string; montant: bigint; nombre: number }[],
      // Dépenses par mois
      this.prisma.$queryRaw`
        SELECT 
          TO_CHAR("dateDepense", 'YYYY-MM') as mois,
          SUM(montant) as montant,
          COUNT(*) as nombre
        FROM "Depense" 
        WHERE "dateDepense" >= ${dateDebut}
        GROUP BY TO_CHAR("dateDepense", 'YYYY-MM')
        ORDER BY mois DESC
      ` as unknown as { mois: string; montant: bigint; nombre: number }[],
      // Paiements par mois
      this.prisma.$queryRaw`
        SELECT 
          TO_CHAR(date, 'YYYY-MM') as mois,
          SUM(montant) as montant,
          COUNT(*) as nombre,
          mode
        FROM "Paiement" 
        WHERE date >= ${dateDebut}
        GROUP BY TO_CHAR(date, 'YYYY-MM'), mode
        ORDER BY mois DESC
      ` as unknown as {
        mois: string;
        montant: bigint;
        nombre: number;
        mode: string;
      }[],
      // Provisions par mois
      this.prisma.$queryRaw`
        SELECT 
          TO_CHAR("dateProvision", 'YYYY-MM') as mois,
          SUM(montant) as montant,
          COUNT(*) as nombre
        FROM "Provision" 
        WHERE "dateProvision" >= ${dateDebut}
        GROUP BY TO_CHAR("dateProvision", 'YYYY-MM')
        ORDER BY mois DESC
      ` as unknown as { mois: string; montant: bigint; nombre: number }[],
      // Factures par statut
      this.prisma.facture.groupBy({
        by: ['statut'],
        _count: true,
        _sum: { montantTotal: true },
        where: {
          dateEmission: { gte: dateDebut },
        },
      }),
      // Honoraires par type
      this.prisma.honoraire.groupBy({
        by: ['typeHonoraire'],
        _count: true,
        _sum: { montantTTC: true },
        where: {
          dateEmission: { gte: dateDebut },
        },
      }),
      // Dépenses par catégorie
      this.prisma.depense.groupBy({
        by: ['categorie'],
        _count: true,
        _sum: { montant: true },
        where: {
          dateDepense: { gte: dateDebut },
        },
      }),
      // Mode de paiement
      this.prisma.paiement.groupBy({
        by: ['mode'],
        _count: true,
        _sum: { montant: true },
        where: {
          date: { gte: dateDebut },
        },
      }),
      // Taux de recouvrement par avocat
      this.prisma.$queryRaw`
        SELECT 
          d."responsableId" as "avocatId",
          u.prenom,
          u.nom,
          SUM(f."montantTotal") as "totalFacture",
          SUM(f."montantPaye") as "totalPaye"
        FROM "Dossier" d
        JOIN "Facture" f ON d.id = f."dossierId"
        JOIN "Utilisateur" u ON d."responsableId" = u.id
        WHERE d."creeLe" >= ${dateDebut}
        AND u.role = 'AVOCAT'
        GROUP BY d."responsableId", u.prenom, u.nom
        ORDER BY "totalFacture" DESC
      ` as unknown as {
        avocatId: string;
        prenom: string;
        nom: string;
        totalFacture: bigint;
        totalPaye: bigint;
      }[],
    ]);

    // Formatage des données
    const facturesParMoisFormate = facturesParMois.map((item) => ({
      mois: item.mois,
      montant: Number(item.montant),
      nombre: item.nombre,
    }));

    const honorairesParMoisFormate = honorairesParMois.map((item) => ({
      mois: item.mois,
      montant: Number(item.montant),
      nombre: item.nombre,
    }));

    const depensesParMoisFormate = depensesParMois.map((item) => ({
      mois: item.mois,
      montant: Number(item.montant),
      nombre: item.nombre,
    }));

    // Regrouper les paiements par mois et par mode
    const paiementsParMoisFormate = paiementsParMois.reduce(
      (acc, item) => {
        if (!acc[item.mois]) {
          acc[item.mois] = {
            mois: item.mois,
            montant: 0,
            nombre: 0,
            parMode: {} as Record<string, { montant: number; nombre: number }>,
          };
        }
        acc[item.mois].montant += Number(item.montant);
        acc[item.mois].nombre += item.nombre;
        acc[item.mois].parMode[item.mode] = {
          montant: Number(item.montant),
          nombre: item.nombre,
        };
        return acc;
      },
      {} as Record<
        string,
        {
          mois: string;
          montant: number;
          nombre: number;
          parMode: Record<string, { montant: number; nombre: number }>;
        }
      >,
    );

    const provisionsParMoisFormate = provisionsParMois.map((item) => ({
      mois: item.mois,
      montant: Number(item.montant),
      nombre: item.nombre,
    }));

    const facturesParStatutFormate = facturesParStatut.reduce(
      (acc, item) => {
        acc[item.statut] = {
          count: item._count,
          montant: Number(item._sum.montantTotal || 0),
        };
        return acc;
      },
      {} as Record<string, { count: number; montant: number }>,
    );

    const honorairesParTypeFormate = honorairesParType.reduce(
      (acc, item) => {
        acc[item.typeHonoraire] = {
          count: item._count,
          montant: Number(item._sum.montantTTC || 0),
        };
        return acc;
      },
      {} as Record<string, { count: number; montant: number }>,
    );

    const depensesParCategorieFormate = depensesParCategorie.reduce(
      (acc, item) => {
        acc[item.categorie] = {
          count: item._count,
          montant: Number(item._sum.montant || 0),
        };
        return acc;
      },
      {} as Record<string, { count: number; montant: number }>,
    );

    const modePaiementFormate = modePaiement.reduce(
      (acc, item) => {
        acc[item.mode] = {
          count: item._count,
          montant: Number(item._sum.montant || 0),
        };
        return acc;
      },
      {} as Record<string, { count: number; montant: number }>,
    );

    const recouvrementParAvocatFormate = recouvrementParAvocat.map((item) => {
      const totalFacture = Number(item.totalFacture);
      const totalPaye = Number(item.totalPaye);
      const tauxRecouvrement =
        totalFacture > 0 ? (totalPaye / totalFacture) * 100 : 0;

      return {
        avocatId: item.avocatId,
        nom: `${item.prenom} ${item.nom}`,
        totalFacture,
        totalPaye,
        tauxRecouvrement: Math.round(tauxRecouvrement * 100) / 100, // Arrondi à 2 décimales
      };
    });

    // Calcul des totaux
    const totalFactures = facturesParMoisFormate.reduce(
      (sum, item) => sum + item.montant,
      0,
    );
    const totalHonoraires = honorairesParMoisFormate.reduce(
      (sum, item) => sum + item.montant,
      0,
    );
    const totalDepenses = depensesParMoisFormate.reduce(
      (sum, item) => sum + item.montant,
      0,
    );
    const totalPaiements = Object.values(paiementsParMoisFormate).reduce(
      (sum, item) => sum + item.montant,
      0,
    );
    const totalProvisions = provisionsParMoisFormate.reduce(
      (sum, item) => sum + item.montant,
      0,
    );

    // Calcul de la marge bénéficiaire
    const margeBeneficiaire =
      totalHonoraires > 0
        ? ((totalHonoraires - totalDepenses) / totalHonoraires) * 100
        : 0;

    // Calcul du taux de recouvrement global
    const totalFacturesGlobal = Number(
      facturesParStatut.reduce(
        (sum, item) => sum + Number(item._sum.montantTotal || 0),
        0,
      ),
    );
    const totalPayeGlobal = Number(
      facturesParStatut
        .filter((item) => item.statut === StatutFacture.PAYEE)
        .reduce((sum, item) => sum + Number(item._sum.montantTotal || 0), 0),
    );
    const tauxRecouvrementGlobal =
      totalFacturesGlobal > 0
        ? (totalPayeGlobal / totalFacturesGlobal) * 100
        : 0;

    const result = {
      periode: period || 'all',
      dateDebut,
      dateFin: now,
      totaux: {
        factures: totalFactures,
        honoraires: totalHonoraires,
        depenses: totalDepenses,
        paiements: totalPaiements,
        provisions: totalProvisions,
        margeBeneficiaire: Math.round(margeBeneficiaire * 100) / 100, // Arrondi à 2 décimales
        tauxRecouvrement: Math.round(tauxRecouvrementGlobal * 100) / 100, // Arrondi à 2 décimales
      },
      evolution: {
        facturesParMois: facturesParMoisFormate,
        honorairesParMois: honorairesParMoisFormate,
        depensesParMois: depensesParMoisFormate,
        paiementsParMois: Object.values(paiementsParMoisFormate),
        provisionsParMois: provisionsParMoisFormate,
      },
      repartition: {
        facturesParStatut: facturesParStatutFormate,
        honorairesParType: honorairesParTypeFormate,
        depensesParCategorie: depensesParCategorieFormate,
        modePaiement: modePaiementFormate,
      },
      recouvrement: {
        parAvocat: recouvrementParAvocatFormate,
        global: tauxRecouvrementGlobal,
      },
    };

    await this.cacheManager.set(cacheKey, result, 600); // Cache pour 10 minutes
    return result;
  }

  async getStatistiquesDossiers(period?: string) {
    const cacheKey = `statistiques-dossiers:${period || 'all'}`;
    const cachedData = await this.cacheManager.get(cacheKey);
    if (cachedData) return cachedData;

    const now = new Date();
    let dateDebut: Date;

    // Définir la période en fonction du paramètre
    switch (period) {
      case 'mois':
        dateDebut = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'trimestre': {
        const trimestre = Math.floor(now.getMonth() / 3);
        dateDebut = new Date(now.getFullYear(), trimestre * 3, 1);
        break;
      }
      case 'annee':
        dateDebut = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        dateDebut = new Date(0); // Depuis le début
    }

    const [
      dossiersParMois,
      dossiersParType,
      dossiersParStatut,
      dossiersParAvocat,
      dossiersParClient,
      dureeMoyenneParType,
      valeurFinanciereParType,
      risqueParType,
      proceduresParType,
      proceduresParStatut,
      delaiMoyenProcedure,
    ] = await Promise.all([
      // Dossiers par mois
      this.prisma.$queryRaw`
        SELECT 
          TO_CHAR("creeLe", 'YYYY-MM') as mois,
          COUNT(*) as nombre
        FROM "Dossier" 
        WHERE "creeLe" >= ${dateDebut}
        GROUP BY TO_CHAR("creeLe", 'YYYY-MM')
        ORDER BY mois DESC
      ` as unknown as { mois: string; nombre: number }[],
      // Dossiers par type
      this.prisma.dossier.groupBy({
        by: ['type'],
        _count: true,
        where: {
          creeLe: { gte: dateDebut },
        },
      }),
      // Dossiers par statut
      this.prisma.dossier.groupBy({
        by: ['statut'],
        _count: true,
        where: {
          creeLe: { gte: dateDebut },
        },
      }),
      // Dossiers par avocat
      this.prisma.$queryRaw`
        SELECT 
          d."responsableId" as "avocatId",
          u.prenom,
          u.nom,
          COUNT(*) as nombre,
          COUNT(CASE WHEN d."statut" = 'CLOS' THEN 1 END) as "clos",
          COUNT(CASE WHEN d."statut" = 'OUVERT' THEN 1 END) as "ouverts",
          COUNT(CASE WHEN d."statut" = 'EN_COURS' THEN 1 END) as "enCours"
        FROM "Dossier" d
        JOIN "Utilisateur" u ON d."responsableId" = u.id
        WHERE d."creeLe" >= ${dateDebut}
        AND u.role = 'AVOCAT'
        GROUP BY d."responsableId", u.prenom, u.nom
        ORDER BY nombre DESC
      ` as unknown as {
        avocatId: string;
        prenom: string;
        nom: string;
        nombre: number;
        clos: number;
        ouverts: number;
        enCours: number;
      }[],
      // Dossiers par client
      this.prisma.$queryRaw`
        SELECT 
          c.id as "clientId",
          c.prenom,
          c.nom,
          c.entreprise,
          COUNT(*) as nombre
        FROM "Dossier" d
        JOIN "Client" c ON d."clientId" = c.id
        WHERE d."creeLe" >= ${dateDebut}
        GROUP BY c.id, c.prenom, c.nom, c.entreprise
        ORDER BY nombre DESC
        LIMIT 20
      ` as unknown as {
        clientId: string;
        prenom: string;
        nom: string;
        entreprise: string;
        nombre: number;
      }[],
      // Durée moyenne de traitement par type de dossier
      this.prisma.$queryRaw`
        SELECT 
          type,
          AVG(EXTRACT(EPOCH FROM ("modifieLe" - "creeLe"))/86400) as "dureeMoyenne"
        FROM "Dossier" 
        WHERE "creeLe" >= ${dateDebut}
        AND "statut" = 'CLOS'
        GROUP BY type
      ` as unknown as { type: string; dureeMoyenne: number }[],
      // Valeur financière par type de dossier
      this.prisma.$queryRaw`
        SELECT 
          type,
          AVG("valeurFinanciere") as "valeurMoyenne",
          SUM("valeurFinanciere") as "valeurTotale"
        FROM "Dossier" 
        WHERE "creeLe" >= ${dateDebut}
        AND "valeurFinanciere" IS NOT NULL
        GROUP BY type
      ` as unknown as {
        type: string;
        valeurMoyenne: number;
        valeurTotale: bigint;
      }[],
      // Niveau de risque par type de dossier
      this.prisma.$queryRaw`
        SELECT 
          type,
          "risqueJuridique",
          COUNT(*) as nombre
        FROM "Dossier" 
        WHERE "creeLe" >= ${dateDebut}
        AND "risqueJuridique" IS NOT NULL
        GROUP BY type, "risqueJuridique"
      ` as unknown as {
        type: string;
        risqueJuridique: string;
        nombre: number;
      }[],
      // Procédures par type
      this.prisma.procedure.groupBy({
        by: ['typeProcedure'],
        _count: true,
        where: {
          dateIntroduction: { gte: dateDebut },
        },
      }),
      // Procédures par statut
      this.prisma.procedure.groupBy({
        by: ['statut'],
        _count: true,
        where: {
          dateIntroduction: { gte: dateDebut },
        },
      }),
      // Délai moyen des procédures
      this.prisma.$queryRaw`
        SELECT 
          "typeProcedure",
          AVG(EXTRACT(EPOCH FROM ("modifieLe" - "dateIntroduction"))/86400) as "delaiMoyen"
        FROM "Procedure" 
        WHERE "dateIntroduction" >= ${dateDebut}
        AND "statut" = 'TERMINEE'
        GROUP BY "typeProcedure"
      ` as unknown as { typeProcedure: string; delaiMoyen: number }[],
    ]);

    // Formatage des données
    const dossiersParMoisFormate = dossiersParMois.map((item) => ({
      mois: item.mois,
      nombre: item.nombre,
    }));

    const dossiersParTypeFormate = dossiersParType.reduce(
      (acc, item) => {
        acc[item.type] = item._count;
        return acc;
      },
      {} as Record<string, number>,
    );

    const dossiersParStatutFormate = dossiersParStatut.reduce(
      (acc, item) => {
        acc[item.statut] = item._count;
        return acc;
      },
      {} as Record<string, number>,
    );

    const dossiersParAvocatFormate = dossiersParAvocat.map((item) => ({
      avocatId: item.avocatId,
      nom: `${item.prenom} ${item.nom}`,
      total: item.nombre,
      clos: item.clos,
      ouverts: item.ouverts,
      enCours: item.enCours,
      tauxClos:
        item.nombre > 0 ? Math.round((item.clos / item.nombre) * 100) : 0,
    }));

    const dossiersParClientFormate = dossiersParClient.map((item) => ({
      clientId: item.clientId,
      nom: item.entreprise || `${item.prenom} ${item.nom}`,
      nombre: item.nombre,
    }));

    const dureeMoyenneParTypeFormate = dureeMoyenneParType.reduce(
      (acc, item) => {
        acc[item.type] = Math.round(item.dureeMoyenne * 10) / 10; // Arrondi à 1 décimale
        return acc;
      },
      {} as Record<string, number>,
    );

    const valeurFinanciereParTypeFormate = valeurFinanciereParType.reduce(
      (acc, item) => {
        acc[item.type] = {
          moyenne: Math.round(Number(item.valeurMoyenne) * 100) / 100, // Arrondi à 2 décimales
          total: Number(item.valeurTotale),
        };
        return acc;
      },
      {} as Record<string, { moyenne: number; total: number }>,
    );

    const risqueParTypeFormate = risqueParType.reduce(
      (acc, item) => {
        if (!acc[item.type]) {
          acc[item.type] = {};
        }
        acc[item.type][item.risqueJuridique] = item.nombre;
        return acc;
      },
      {} as Record<string, Record<string, number>>,
    );

    const proceduresParTypeFormate = proceduresParType.reduce(
      (acc, item) => {
        acc[item.typeProcedure] = item._count;
        return acc;
      },
      {} as Record<string, number>,
    );

    const proceduresParStatutFormate = proceduresParStatut.reduce(
      (acc, item) => {
        acc[item.statut] = item._count;
        return acc;
      },
      {} as Record<string, number>,
    );

    const delaiMoyenProcedureFormate = delaiMoyenProcedure.reduce(
      (acc, item) => {
        acc[item.typeProcedure] = Math.round(item.delaiMoyen * 10) / 10; // Arrondi à 1 décimale
        return acc;
      },
      {} as Record<string, number>,
    );

    // Calcul des totaux
    const totalDossiers = dossiersParMoisFormate.reduce(
      (sum, item) => sum + item.nombre,
      0,
    );
    const totalDossiersClos = dossiersParStatutFormate['CLOS'] || 0;
    const totalDossiersOuverts = dossiersParStatutFormate['OUVERT'] || 0;
    const totalDossiersEnCours = dossiersParStatutFormate['EN_COURS'] || 0;

    // Calcul du taux de clôture
    const tauxCloture =
      totalDossiers > 0 ? (totalDossiersClos / totalDossiers) * 100 : 0;

    // Calcul de la durée moyenne de traitement globale
    const dureeMoyenneGlobale =
      Object.values(dureeMoyenneParTypeFormate).reduce(
        (sum, duree) => sum + duree,
        0,
      ) / (Object.keys(dureeMoyenneParTypeFormate).length || 1);

    const result = {
      periode: period || 'all',
      dateDebut,
      dateFin: now,
      resume: {
        total: totalDossiers,
        clos: totalDossiersClos,
        ouverts: totalDossiersOuverts,
        enCours: totalDossiersEnCours,
        tauxCloture: Math.round(tauxCloture * 100) / 100, // Arrondi à 2 décimales
        dureeMoyenne: Math.round(dureeMoyenneGlobale * 10) / 10, // Arrondi à 1 décimale
      },
      evolution: {
        dossiersParMois: dossiersParMoisFormate,
      },
      repartition: {
        parType: dossiersParTypeFormate,
        parStatut: dossiersParStatutFormate,
        parAvocat: dossiersParAvocatFormate,
        parClient: dossiersParClientFormate,
      },
      analyse: {
        dureeMoyenneParType: dureeMoyenneParTypeFormate,
        valeurFinanciereParType: valeurFinanciereParTypeFormate,
        risqueParType: risqueParTypeFormate,
      },
      procedures: {
        parType: proceduresParTypeFormate,
        parStatut: proceduresParStatutFormate,
        delaiMoyenParType: delaiMoyenProcedureFormate,
      },
    };

    await this.cacheManager.set(cacheKey, result, 600); // Cache pour 10 minutes
    return result;
  }

  async invalidateStatistiquesCache(): Promise<void> {
    try {
      if (
        'stores' in this.cacheManager &&
        Array.isArray(this.cacheManager.stores)
      ) {
        const store = this.cacheManager.stores[0];
        if ('keys' in store && typeof store.keys === 'function') {
          const keys = await store.keys('statistiques-*');
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
      console.error(
        "Erreur lors de l'invalidation du cache des statistiques:",
        error,
      );
    }
  }
}
