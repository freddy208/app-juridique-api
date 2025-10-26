// constants/clients.constants.ts

/**
 * Constantes pour le module Clients
 */

// Messages d'erreur
export const CLIENT_ERROR_MESSAGES = {
  NOT_FOUND: 'Client non trouvé',
  EMAIL_EXISTS: 'Un client avec cet email existe déjà',
  PHONE_EXISTS: 'Un client avec ce numéro de téléphone existe déjà',
  CANNOT_DELETE_WITH_ACTIVE_DOSSIERS:
    'Impossible de supprimer un client avec des dossiers actifs',
  INVALID_STATUS: 'Statut invalide',
  INVALID_ACTION: 'Action non supportée',
  CREATE_ERROR: 'Une erreur est survenue lors de la création du client',
  UPDATE_ERROR: 'Une erreur est survenue lors de la mise à jour du client',
  DELETE_ERROR: 'Une erreur est survenue lors de la suppression du client',
  SEARCH_ERROR: 'Une erreur est survenue lors de la recherche',
  STATS_ERROR: 'Une erreur est survenue lors du calcul des statistiques',
};

// Messages de succès
export const CLIENT_SUCCESS_MESSAGES = {
  CREATED: 'Client créé avec succès',
  UPDATED: 'Client mis à jour avec succès',
  DELETED: 'Client archivé avec succès',
  STATUS_CHANGED: 'Statut du client changé avec succès',
  NOTE_ADDED: 'Note ajoutée avec succès',
  DOCUMENT_ADDED: "Document d'identité ajouté avec succès",
  VISIT_MARKED: 'Dernière visite mise à jour',
};

// Limites par défaut
export const CLIENT_DEFAULTS = {
  PAGE: 1,
  LIMIT: 10,
  MAX_LIMIT: 100,
  SORT_BY: 'creeLe',
  SORT_ORDER: 'desc' as const,
  SEARCH_LIMIT: 10,
  MAX_SEARCH_LIMIT: 50,
  ACTIVITY_LIMIT: 50,
  MAX_ACTIVITY_LIMIT: 100,
  INACTIVE_DAYS: 90,
};

// Rate limiting
export const CLIENT_RATE_LIMITS = {
  CREATE: { limit: 20, ttl: 60000 }, // 20 requêtes par minute
  SEARCH: { limit: 30, ttl: 60000 }, // 30 requêtes par minute
  BULK: { limit: 5, ttl: 60000 }, // 5 requêtes par minute
};

// Validations
export const CLIENT_VALIDATION = {
  PRENOM: {
    MIN: 2,
    MAX: 100,
  },
  NOM: {
    MIN: 2,
    MAX: 100,
  },
  NOM_ENTREPRISE: {
    MAX: 200,
  },
  EMAIL: {
    MAX: 150,
  },
  ADRESSE: {
    MAX: 500,
  },
  TELEPHONE_PATTERN: /^(\+237)?[6][0-9]{8}$/,
  NOTE_TITRE: {
    MAX: 200,
  },
};

// Statuts disponibles
export const CLIENT_STATUSES = {
  ACTIF: 'ACTIF',
  INACTIF: 'INACTIF',
  POTENTIEL: 'POTENTIEL',
  ARCHIVE: 'ARCHIVE',
} as const;

// Types de documents d'identité
export const IDENTITY_DOCUMENT_TYPES = {
  CNI: 'CNI',
  PASSEPORT: 'PASSEPORT',
  PERMIS_CONDUIRE: 'PERMIS_CONDUIRE',
  ACTE_NAISSANCE: 'ACTE_NAISSANCE',
  REGISTRE_COMMERCE: 'REGISTRE_COMMERCE',
  STATUTS_ENTREPRISE: 'STATUTS_ENTREPRISE',
  AUTRE: 'AUTRE',
} as const;

// Actions en masse disponibles
export const BULK_ACTIONS = {
  CHANGE_STATUS: 'CHANGE_STATUS',
  SET_VIP: 'SET_VIP',
  REMOVE_VIP: 'REMOVE_VIP',
  ARCHIVE: 'ARCHIVE',
  EXPORT: 'EXPORT',
  DELETE: 'DELETE',
} as const;

// Champs de tri disponibles
export const SORTABLE_FIELDS = [
  'creeLe',
  'modifieLe',
  'prenom',
  'nom',
  'nomEntreprise',
  'email',
  'chiffreAffaires',
  'derniereVisite',
] as const;

// Relations à inclure par défaut
export const DEFAULT_INCLUDES = {
  minimal: {
    _count: {
      select: {
        dossiers: true,
        factures: true,
        notes: true,
      },
    },
  },
  standard: {
    dossiers: {
      select: {
        id: true,
        numeroUnique: true,
        titre: true,
        statut: true,
      },
      take: 5,
      orderBy: { creeLe: 'desc' },
    },
    factures: {
      select: {
        id: true,
        numeroFacture: true,
        montantTotal: true,
        statut: true,
      },
      take: 5,
      orderBy: { creeLe: 'desc' },
    },
    _count: {
      select: {
        dossiers: true,
        factures: true,
        notes: true,
      },
    },
  },
  full: {
    dossiers: {
      include: {
        responsable: {
          select: {
            id: true,
            prenom: true,
            nom: true,
            email: true,
          },
        },
        _count: {
          select: {
            documents: true,
            taches: true,
          },
        },
      },
      orderBy: { creeLe: 'desc' },
    },
    factures: {
      orderBy: { creeLe: 'desc' },
    },
    notes: {
      include: {
        auteur: {
          select: {
            id: true,
            prenom: true,
            nom: true,
          },
        },
      },
      orderBy: { creeLe: 'desc' },
    },
    DocumentIdentite: {
      orderBy: { creeLe: 'desc' },
    },
    honoraires: {
      orderBy: { creeLe: 'desc' },
    },
    paiements: {
      orderBy: { datePaiement: 'desc' },
    },
    provisions: {
      orderBy: { creeLe: 'desc' },
    },
    CommunicationClient: {
      orderBy: { creeLe: 'desc' },
      take: 20,
    },
    Satisfaction: {
      orderBy: { dateEvaluation: 'desc' },
    },
  },
};

// Codes d'événements pour l'audit
export const CLIENT_AUDIT_EVENTS = {
  CREATE: 'CREATE_CLIENT',
  UPDATE: 'UPDATE_CLIENT',
  DELETE: 'DELETE_CLIENT',
  CHANGE_STATUS: 'CHANGE_CLIENT_STATUS',
  ADD_NOTE: 'ADD_CLIENT_NOTE',
  ADD_DOCUMENT: 'ADD_CLIENT_IDENTITY_DOCUMENT',
  BULK_ACTION: 'BULK_CLIENT_ACTION',
  MARK_VISIT: 'MARK_CLIENT_VISIT',
} as const;

// Formats d'export
export const EXPORT_FORMATS = {
  CSV: 'csv',
  EXCEL: 'excel',
  PDF: 'pdf',
  JSON: 'json',
} as const;

// Colonnes pour l'export
export const EXPORT_COLUMNS = [
  { key: 'id', label: 'ID' },
  { key: 'prenom', label: 'Prénom' },
  { key: 'nom', label: 'Nom' },
  { key: 'nomEntreprise', label: 'Entreprise' },
  { key: 'telephone', label: 'Téléphone' },
  { key: 'email', label: 'Email' },
  { key: 'adresse', label: 'Adresse' },
  { key: 'statut', label: 'Statut' },
  { key: 'statutVIP', label: 'VIP' },
  { key: 'chiffreAffaires', label: "Chiffre d'affaires (FCFA)" },
  { key: 'derniereVisite', label: 'Dernière visite' },
  { key: 'creeLe', label: 'Date de création' },
  { key: 'modifieLe', label: 'Dernière modification' },
] as const;

// Seuils pour les alertes
export const CLIENT_THRESHOLDS = {
  INACTIVE_DAYS_WARNING: 30,
  INACTIVE_DAYS_CRITICAL: 90,
  HIGH_VALUE_CLIENT: 10000000, // 10M FCFA
  VIP_THRESHOLD: 5000000, // 5M FCFA
  UNPAID_INVOICES_WARNING: 2,
  UNPAID_INVOICES_CRITICAL: 5,
};

// Priorités pour les clients
export const CLIENT_PRIORITIES = {
  VIP: 'VIP',
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW',
} as const;

// Segments de clients
export const CLIENT_SEGMENTS = {
  PREMIUM: {
    name: 'Premium',
    minCA: 10000000,
    color: '#FFD700',
  },
  GOLD: {
    name: 'Gold',
    minCA: 5000000,
    color: '#FFA500',
  },
  SILVER: {
    name: 'Silver',
    minCA: 1000000,
    color: '#C0C0C0',
  },
  BRONZE: {
    name: 'Bronze',
    minCA: 0,
    color: '#CD7F32',
  },
} as const;

// Templates de communication
export const COMMUNICATION_TEMPLATES = {
  WELCOME: {
    title: 'Bienvenue',
    body: 'Bienvenue au cabinet. Nous sommes ravis de vous accompagner dans vos démarches juridiques.',
  },
  INACTIVE_REMINDER: {
    title: 'Nous pensons à vous',
    body: "Cela fait un moment que nous n'avons pas eu de vos nouvelles. N'hésitez pas à nous contacter pour tout besoin juridique.",
  },
  DOCUMENT_READY: {
    title: 'Document prêt',
    body: 'Votre document est prêt. Vous pouvez venir le récupérer au cabinet.',
  },
  PAYMENT_REMINDER: {
    title: 'Rappel de paiement',
    body: "Nous vous rappelons qu'un paiement est en attente. Merci de régulariser votre situation.",
  },
  SATISFACTION_SURVEY: {
    title: 'Votre avis nous intéresse',
    body: 'Nous aimerions connaître votre niveau de satisfaction concernant nos services.',
  },
} as const;

// Permissions par rôle
export const CLIENT_PERMISSIONS = {
  ADMIN: ['create', 'read', 'update', 'delete', 'bulk', 'stats', 'export'],
  DG: ['create', 'read', 'update', 'delete', 'bulk', 'stats', 'export'],
  AVOCAT: ['create', 'read', 'update', 'stats'],
  SECRETAIRE: ['create', 'read', 'update'],
  ASSISTANT: ['read'],
} as const;

// Statistiques - périodes
export const STATS_PERIODS = {
  TODAY: 'today',
  WEEK: 'week',
  MONTH: 'month',
  QUARTER: 'quarter',
  YEAR: 'year',
  CUSTOM: 'custom',
} as const;

// Cache TTL (en secondes)
export const CACHE_TTL = {
  STATS: 300, // 5 minutes
  PERFORMANCE: 600, // 10 minutes
  CLIENT_LIST: 60, // 1 minute
  CLIENT_DETAIL: 120, // 2 minutes
} as const;
