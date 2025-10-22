import { PrismaClient, CategorieModele, TypeDossier } from '@prisma/client';

export async function modelesDocumentsSeed(prisma: PrismaClient) {
  console.log('Création des modèles de documents...');

  const modeles = [
    {
      nom: 'Assignation en matière civile',
      categorie: CategorieModele.ASSIGNATION,
      typeDossier: TypeDossier.CONTENTIEUX,
      contenu: `<p>TRIBUNAL DE PREMIÈRE INSTANCE DE [VILLE]</p> ...`,
      variables: {
        ville: 'Ville du tribunal',
        date: "Date de l'audience",
        numero: "Numéro de l'arrêt",
        nom_du_demandeur: 'Nom complet du demandeur',
        adresse: 'Adresse du demandeur',
        contenu_de_la_decision: 'Contenu détaillé de la décision',
      },
      langue: 'FR',
    },
    {
      nom: 'Conclusions en défense',
      categorie: CategorieModele.CONCLUSIONS,
      typeDossier: TypeDossier.CONTENTIEUX,
      contenu: `<p>CONCLUSIONS POUR [NOM DU DÉFENDEUR]</p> ...`,
      variables: {
        nom_du_defendeur: 'Nom complet du défendeur',
        nom_de_l_avocat: "Nom de l'avocat",
        adresse: 'Adresse du défendeur',
        date: "Date de l'assignation",
        arguments_et_motivations: 'Développement des arguments',
        dispositif: 'Dispositif de la demande',
      },
      langue: 'FR',
    },
    {
      nom: 'Contrat de prestation de services juridiques',
      categorie: CategorieModele.CONTRAT,
      typeDossier: null,
      contenu: `<p>CONTRAT DE PRESTATION DE SERVICES JURIDIQUES</p> ...`,
      variables: {
        nom_du_cabinet: 'Nom du cabinet juridique',
        adresse_du_cabinet: 'Adresse du cabinet',
        nom_du_representant: 'Nom du représentant du cabinet',
        qualite: 'Qualité du représentant',
        nom_du_client: 'Nom complet du client',
        adresse_du_client: 'Adresse du client',
        objet_de_la_mission: 'Description de la mission',
        duree: 'Durée du contrat',
        montant: 'Montant des honoraires',
        modalites_de_paiement: 'Modalités de paiement',
        autres_articles: 'Autres clauses contractuelles',
        lieu: 'Lieu de signature',
        date: 'Date de signature',
        signature: 'Signature',
      },
      langue: 'FR',
    },
    {
      nom: 'Pouvoir spécial',
      categorie: CategorieModele.POUVOIR,
      typeDossier: null,
      contenu: `<p>POUVOIR SPÉCIAL</p> ...`,
      variables: {
        nom_complet: 'Nom complet du client',
        date_de_naissance: 'Date de naissance',
        lieu_de_naissance: 'Lieu de naissance',
        nationalite: 'Nationalité',
        adresse: 'Adresse complète',
        nom_de_l_avocat: "Nom de l'avocat",
        adresse_du_cabinet: 'Adresse du cabinet',
        objet_du_litige: 'Description du litige',
        lieu: 'Lieu de signature',
        date: 'Date de signature',
        signature: 'Signature',
      },
      langue: 'FR',
    },
    {
      nom: 'Attestation de consultation juridique',
      categorie: CategorieModele.ATTESTATION,
      typeDossier: null,
      contenu: `<p>ATTESTATION DE CONSULTATION JURIDIQUE</p> ...`,
      variables: {
        nom_de_l_avocat: "Nom de l'avocat",
        adresse_du_cabinet: 'Adresse du cabinet',
        date: 'Date de la consultation',
        nom_du_client: 'Nom complet du client',
        adresse_du_client: 'Adresse du client',
        objet_de_la_consultation: 'Sujet de la consultation',
        conseils_donnes: 'Résumé des conseils prodigués',
        lieu: 'Lieu de délivrance',
        signature_et_cachet: 'Signature et cachet du cabinet',
      },
      langue: 'FR',
    },
  ];

  // Upsert pour éviter les doublons si seed relancé
  await Promise.all(
    modeles.map((modele) =>
      prisma.modeleDocument.upsert({
        where: { nom: modele.nom }, // clé unique sur le nom du modèle
        update: {
          categorie: modele.categorie,
          typeDossier: modele.typeDossier,
          contenu: modele.contenu,
          variables: JSON.stringify(modele.variables),
          langue: modele.langue,
        },
        create: {
          nom: modele.nom,
          categorie: modele.categorie,
          typeDossier: modele.typeDossier,
          contenu: modele.contenu,
          variables: JSON.stringify(modele.variables),
          langue: modele.langue,
        },
      }),
    ),
  );

  console.log('Modèles de documents créés ou mis à jour avec succès!');
}
