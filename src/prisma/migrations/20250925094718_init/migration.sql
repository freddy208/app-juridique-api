/*
  Warnings:

  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."RoleUtilisateur" AS ENUM ('ADMIN', 'DG', 'AVOCAT', 'SECRETAIRE', 'ASSISTANT', 'JURISTE', 'STAGIAIRE');

-- CreateEnum
CREATE TYPE "public"."StatutUtilisateur" AS ENUM ('ACTIF', 'INACTIF', 'SUSPENDU');

-- CreateEnum
CREATE TYPE "public"."StatutClient" AS ENUM ('ACTIF', 'INACTIF');

-- CreateEnum
CREATE TYPE "public"."TypeDossier" AS ENUM ('SINISTRE_CORPOREL', 'SINISTRE_MATERIEL', 'SINISTRE_MORTEL', 'IMMOBILIER', 'SPORT', 'CONTRAT', 'CONTENTIEUX', 'AUTRE');

-- CreateEnum
CREATE TYPE "public"."StatutDossier" AS ENUM ('OUVERT', 'EN_COURS', 'CLOS', 'ARCHIVE');

-- CreateEnum
CREATE TYPE "public"."GraviteBlessure" AS ENUM ('MINEUR', 'MOYEN', 'GRAVE', 'CRITIQUE');

-- CreateEnum
CREATE TYPE "public"."CategorieVehicule" AS ENUM ('VOITURE', 'MOTO', 'CAMION', 'AUTRE');

-- CreateEnum
CREATE TYPE "public"."RegimeFoncier" AS ENUM ('TITRE_FONCIER', 'COUTUMIER', 'BAIL');

-- CreateEnum
CREATE TYPE "public"."EtapeProcedure" AS ENUM ('INSTRUCTIVE', 'AUDIENCE', 'JUGEMENT', 'APPEL', 'EXECUTION');

-- CreateEnum
CREATE TYPE "public"."StatutDocument" AS ENUM ('ACTIF', 'ARCHIVE', 'SUPPRIME');

-- CreateEnum
CREATE TYPE "public"."StatutTache" AS ENUM ('A_FAIRE', 'EN_COURS', 'TERMINEE');

-- CreateEnum
CREATE TYPE "public"."StatutEvenement" AS ENUM ('PREVU', 'TERMINE', 'ANNULE');

-- CreateEnum
CREATE TYPE "public"."StatutMessage" AS ENUM ('ENVOYE', 'LU', 'SUPPRIME');

-- CreateEnum
CREATE TYPE "public"."StatutFacture" AS ENUM ('BROUILLON', 'ENVOYEE', 'PAYEE', 'EN_RETARD');

-- CreateEnum
CREATE TYPE "public"."StatutPermission" AS ENUM ('ACTIF', 'INACTIF');

-- CreateEnum
CREATE TYPE "public"."StatutArchive" AS ENUM ('ARCHIVE', 'RESTAURE');

-- CreateEnum
CREATE TYPE "public"."TypeCorrespondance" AS ENUM ('APPEL', 'EMAIL', 'RENDEZ_VOUS', 'AUTRE');

-- DropTable
DROP TABLE "public"."User";

-- CreateTable
CREATE TABLE "public"."Utilisateur" (
    "id" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "motDePasse" TEXT NOT NULL,
    "role" "public"."RoleUtilisateur" NOT NULL DEFAULT 'ASSISTANT',
    "statut" "public"."StatutUtilisateur" NOT NULL DEFAULT 'ACTIF',
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Utilisateur_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Client" (
    "id" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "nomEntreprise" TEXT,
    "telephone" TEXT,
    "email" TEXT,
    "adresse" TEXT,
    "statut" "public"."StatutClient" NOT NULL DEFAULT 'ACTIF',
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Dossier" (
    "id" TEXT NOT NULL,
    "numeroUnique" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "type" "public"."TypeDossier" NOT NULL,
    "description" TEXT,
    "responsableId" TEXT,
    "statut" "public"."StatutDossier" NOT NULL DEFAULT 'OUVERT',
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dossier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SinistreCorporel" (
    "id" TEXT NOT NULL,
    "dossierId" TEXT NOT NULL,
    "dateAccident" TIMESTAMP(3) NOT NULL,
    "lieuAccident" TEXT NOT NULL,
    "numeroPvPolice" TEXT,
    "hopital" TEXT,
    "rapportMedical" TEXT,
    "graviteBlessure" "public"."GraviteBlessure" NOT NULL DEFAULT 'MINEUR',
    "assureur" TEXT,
    "numeroSinistre" TEXT,
    "temoins" JSONB,
    "prejudice" DECIMAL(65,30),
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SinistreCorporel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SinistreMateriel" (
    "id" TEXT NOT NULL,
    "dossierId" TEXT NOT NULL,
    "dateAccident" TIMESTAMP(3) NOT NULL,
    "lieuAccident" TEXT NOT NULL,
    "categorieVehicule" "public"."CategorieVehicule",
    "marqueVehicule" TEXT,
    "modeleVehicule" TEXT,
    "immatriculation" TEXT,
    "numeroChassis" TEXT,
    "numeroPvPolice" TEXT,
    "assureur" TEXT,
    "numeroSinistre" TEXT,
    "estimationDegats" DECIMAL(65,30),
    "photosUrls" JSONB,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SinistreMateriel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SinistreMortel" (
    "id" TEXT NOT NULL,
    "dossierId" TEXT NOT NULL,
    "dateDeces" TIMESTAMP(3) NOT NULL,
    "lieuDeces" TEXT,
    "certificatDeces" TEXT,
    "certificatMedicoLegal" TEXT,
    "numeroPvPolice" TEXT,
    "causeDeces" TEXT,
    "ayantsDroit" JSONB,
    "indemniteReclamee" DECIMAL(65,30),
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SinistreMortel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Immobilier" (
    "id" TEXT NOT NULL,
    "dossierId" TEXT NOT NULL,
    "adresseBien" TEXT NOT NULL,
    "numeroTitre" TEXT,
    "numeroCadastre" TEXT,
    "referenceNotaire" TEXT,
    "regimeFoncier" "public"."RegimeFoncier",
    "surfaceM2" DECIMAL(65,30),
    "typeLitige" TEXT,
    "chefQuartier" TEXT,
    "temoinsBornage" JSONB,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Immobilier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Sport" (
    "id" TEXT NOT NULL,
    "dossierId" TEXT NOT NULL,
    "club" TEXT,
    "competition" TEXT,
    "dateIncident" TIMESTAMP(3),
    "instanceSportive" TEXT,
    "referenceContrat" TEXT,
    "sanctions" JSONB,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Contrat" (
    "id" TEXT NOT NULL,
    "dossierId" TEXT NOT NULL,
    "partieA" TEXT NOT NULL,
    "partieB" TEXT NOT NULL,
    "dateEffet" TIMESTAMP(3) NOT NULL,
    "dateExpiration" TIMESTAMP(3),
    "valeurContrat" DECIMAL(65,30),
    "loiApplicable" TEXT DEFAULT 'CAMEROUN',
    "referenceNotaire" TEXT,
    "contratUrl" TEXT,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contrat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Contentieux" (
    "id" TEXT NOT NULL,
    "dossierId" TEXT NOT NULL,
    "numeroAffaire" TEXT,
    "tribunal" TEXT,
    "juridiction" TEXT,
    "demandeur" TEXT,
    "defendeur" TEXT,
    "avocatPlaignant" TEXT,
    "avocatDefenseur" TEXT,
    "etapeProcedure" "public"."EtapeProcedure" DEFAULT 'INSTRUCTIVE',
    "montantReclame" DECIMAL(65,30),
    "datesAudiences" JSONB,
    "depots" JSONB,
    "rapportHussier" TEXT,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contentieux_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Document" (
    "id" TEXT NOT NULL,
    "dossierId" TEXT NOT NULL,
    "televersePar" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "statut" "public"."StatutDocument" NOT NULL DEFAULT 'ACTIF',
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Tache" (
    "id" TEXT NOT NULL,
    "dossierId" TEXT,
    "titre" TEXT NOT NULL,
    "description" TEXT,
    "assigneeId" TEXT,
    "creeParId" TEXT NOT NULL,
    "dateLimite" TIMESTAMP(3),
    "statut" "public"."StatutTache" NOT NULL DEFAULT 'A_FAIRE',
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."EvenementCalendrier" (
    "id" TEXT NOT NULL,
    "dossierId" TEXT,
    "titre" TEXT NOT NULL,
    "description" TEXT,
    "debut" TIMESTAMP(3) NOT NULL,
    "fin" TIMESTAMP(3) NOT NULL,
    "creeParId" TEXT NOT NULL,
    "statut" "public"."StatutEvenement" NOT NULL DEFAULT 'PREVU',
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EvenementCalendrier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MessageChat" (
    "id" TEXT NOT NULL,
    "dossierId" TEXT,
    "expediteurId" TEXT NOT NULL,
    "contenu" TEXT NOT NULL,
    "statut" "public"."StatutMessage" NOT NULL DEFAULT 'ENVOYE',
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MessageChat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Facture" (
    "id" TEXT NOT NULL,
    "dossierId" TEXT,
    "clientId" TEXT NOT NULL,
    "montant" DECIMAL(65,30) NOT NULL,
    "dateEcheance" TIMESTAMP(3) NOT NULL,
    "payee" BOOLEAN NOT NULL DEFAULT false,
    "statut" "public"."StatutFacture" NOT NULL DEFAULT 'BROUILLON',
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Facture_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PermissionRole" (
    "id" TEXT NOT NULL,
    "role" "public"."RoleUtilisateur" NOT NULL,
    "module" TEXT NOT NULL,
    "lecture" BOOLEAN NOT NULL DEFAULT true,
    "ecriture" BOOLEAN NOT NULL DEFAULT false,
    "suppression" BOOLEAN NOT NULL DEFAULT false,
    "statut" "public"."StatutPermission" NOT NULL DEFAULT 'ACTIF',
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PermissionRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."JournalAudit" (
    "id" TEXT NOT NULL,
    "utilisateurId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "typeCible" TEXT NOT NULL,
    "cibleId" TEXT NOT NULL,
    "ancienneValeur" JSONB,
    "nouvelleValeur" JSONB,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JournalAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Archive" (
    "id" TEXT NOT NULL,
    "typeObjet" TEXT NOT NULL,
    "objetId" TEXT NOT NULL,
    "archivePar" TEXT NOT NULL,
    "dateArchive" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "statut" "public"."StatutArchive" NOT NULL DEFAULT 'ARCHIVE',
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Archive_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Correspondance" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "utilisateurId" TEXT NOT NULL,
    "type" "public"."TypeCorrespondance" NOT NULL,
    "contenu" TEXT,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Correspondance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Note" (
    "id" TEXT NOT NULL,
    "clientId" TEXT,
    "dossierId" TEXT,
    "utilisateurId" TEXT NOT NULL,
    "contenu" TEXT NOT NULL,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Utilisateur_email_key" ON "public"."Utilisateur"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Dossier_numeroUnique_key" ON "public"."Dossier"("numeroUnique");

-- CreateIndex
CREATE UNIQUE INDEX "SinistreCorporel_dossierId_key" ON "public"."SinistreCorporel"("dossierId");

-- CreateIndex
CREATE UNIQUE INDEX "SinistreMateriel_dossierId_key" ON "public"."SinistreMateriel"("dossierId");

-- CreateIndex
CREATE UNIQUE INDEX "SinistreMortel_dossierId_key" ON "public"."SinistreMortel"("dossierId");

-- CreateIndex
CREATE UNIQUE INDEX "Immobilier_dossierId_key" ON "public"."Immobilier"("dossierId");

-- CreateIndex
CREATE UNIQUE INDEX "Sport_dossierId_key" ON "public"."Sport"("dossierId");

-- CreateIndex
CREATE UNIQUE INDEX "Contrat_dossierId_key" ON "public"."Contrat"("dossierId");

-- CreateIndex
CREATE UNIQUE INDEX "Contentieux_dossierId_key" ON "public"."Contentieux"("dossierId");

-- AddForeignKey
ALTER TABLE "public"."Dossier" ADD CONSTRAINT "Dossier_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Dossier" ADD CONSTRAINT "Dossier_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "public"."Utilisateur"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SinistreCorporel" ADD CONSTRAINT "SinistreCorporel_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "public"."Dossier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SinistreMateriel" ADD CONSTRAINT "SinistreMateriel_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "public"."Dossier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SinistreMortel" ADD CONSTRAINT "SinistreMortel_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "public"."Dossier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Immobilier" ADD CONSTRAINT "Immobilier_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "public"."Dossier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Sport" ADD CONSTRAINT "Sport_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "public"."Dossier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Contrat" ADD CONSTRAINT "Contrat_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "public"."Dossier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Contentieux" ADD CONSTRAINT "Contentieux_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "public"."Dossier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Document" ADD CONSTRAINT "Document_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "public"."Dossier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Document" ADD CONSTRAINT "Document_televersePar_fkey" FOREIGN KEY ("televersePar") REFERENCES "public"."Utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Tache" ADD CONSTRAINT "Tache_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "public"."Dossier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Tache" ADD CONSTRAINT "Tache_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "public"."Utilisateur"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Tache" ADD CONSTRAINT "Tache_creeParId_fkey" FOREIGN KEY ("creeParId") REFERENCES "public"."Utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EvenementCalendrier" ADD CONSTRAINT "EvenementCalendrier_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "public"."Dossier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EvenementCalendrier" ADD CONSTRAINT "EvenementCalendrier_creeParId_fkey" FOREIGN KEY ("creeParId") REFERENCES "public"."Utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MessageChat" ADD CONSTRAINT "MessageChat_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "public"."Dossier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MessageChat" ADD CONSTRAINT "MessageChat_expediteurId_fkey" FOREIGN KEY ("expediteurId") REFERENCES "public"."Utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Facture" ADD CONSTRAINT "Facture_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "public"."Dossier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Facture" ADD CONSTRAINT "Facture_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."JournalAudit" ADD CONSTRAINT "JournalAudit_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "public"."Utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Archive" ADD CONSTRAINT "Archive_archivePar_fkey" FOREIGN KEY ("archivePar") REFERENCES "public"."Utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Correspondance" ADD CONSTRAINT "Correspondance_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Correspondance" ADD CONSTRAINT "Correspondance_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "public"."Utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Note" ADD CONSTRAINT "Note_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Note" ADD CONSTRAINT "Note_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "public"."Dossier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Note" ADD CONSTRAINT "Note_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "public"."Utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
