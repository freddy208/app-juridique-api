/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { QueryNotificationsDto } from './dto/query-notifications.dto';
import { BulkNotificationDto } from './dto/bulk-notification.dto';
import {
  NotificationResponse,
  NotificationStatsResponse,
} from './interfaces/notification-response.interface';
import { PaginationUtil } from '../common/utils/pagination.util';
import { UsersService } from '../users/users.service';

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @Inject(forwardRef(() => UsersService))
    private usersService: UsersService,
  ) {}

  // -------------------- CRUD DE BASE --------------------
  async create(
    createNotificationDto: CreateNotificationDto,
  ): Promise<NotificationResponse> {
    const { utilisateurId, titre, message, type, lien } = createNotificationDto;

    // Vérifier si l'utilisateur existe
    const utilisateur = await this.prisma.utilisateur.findUnique({
      where: { id: utilisateurId },
    });

    if (!utilisateur) {
      throw new NotFoundException(
        `Utilisateur avec l'ID ${utilisateurId} non trouvé`,
      );
    }

    // Créer la notification
    const notification = await this.prisma.notification.create({
      data: {
        utilisateurId,
        titre,
        message,
        type,
        lien,
      },
    });

    // Invalider le cache des notifications de l'utilisateur
    await this.invalidateUserNotificationsCache(utilisateurId);

    return notification as NotificationResponse; // Conversion explicite
  }

  async findAll(query: QueryNotificationsDto) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'creeLe',
      sortOrder = 'desc',
      utilisateurId,
      type,
      lu,
      search,
    } = query;

    // Clé de cache pour cette requête
    const cacheKey = `notifications:${JSON.stringify(query)}`;
    const cachedResult = await this.cacheManager.get(cacheKey);

    if (cachedResult) {
      return cachedResult;
    }

    // Construire les filtres
    const where: any = {};

    if (utilisateurId) {
      where.utilisateurId = utilisateurId;
    }

    if (type) {
      where.type = type;
    }

    if (lu !== undefined) {
      where.lu = lu;
    }

    if (search) {
      where.OR = [
        { titre: { contains: search, mode: 'insensitive' } },
        { message: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Obtenir les paramètres de pagination
    const paginationParams = PaginationUtil.getPrismaPaginationParams({
      page,
      limit,
      sortBy,
      sortOrder,
    });

    // Exécuter la requête
    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        ...paginationParams,
      }),
      this.prisma.notification.count({ where }),
    ]);

    // Formater la réponse
    const result = PaginationUtil.createPaginationResult(notifications, total, {
      page,
      limit,
      sortBy,
      sortOrder,
    });

    // Mettre en cache pour 2 minutes (les notifications changent fréquemment)
    await this.cacheManager.set(cacheKey, result, 120);

    return result;
  }

  async findOne(id: string): Promise<NotificationResponse> {
    const cacheKey = `notification:${id}`;
    const cachedNotification = await this.cacheManager.get(cacheKey);

    if (cachedNotification) {
      return cachedNotification as NotificationResponse; // Conversion explicite
    }

    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new NotFoundException(`Notification avec l'ID ${id} non trouvée`);
    }

    // Mettre en cache pour 5 minutes
    await this.cacheManager.set(cacheKey, notification, 300);

    return notification as NotificationResponse; // Conversion explicite
  }

  async update(
    id: string,
    updateNotificationDto: UpdateNotificationDto,
  ): Promise<NotificationResponse> {
    // Vérifier si la notification existe
    const existingNotification = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (!existingNotification) {
      throw new NotFoundException(`Notification avec l'ID ${id} non trouvée`);
    }

    // Mettre à jour la notification
    const updatedNotification = await this.prisma.notification.update({
      where: { id },
      data: updateNotificationDto,
    });

    // Invalider les caches
    await this.cacheManager.del(`notification:${id}`);
    await this.invalidateUserNotificationsCache(
      existingNotification.utilisateurId,
    );

    return updatedNotification as NotificationResponse; // Conversion explicite
  }

  async remove(id: string): Promise<void> {
    // Vérifier si la notification existe
    const existingNotification = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (!existingNotification) {
      throw new NotFoundException(`Notification avec l'ID ${id} non trouvée`);
    }

    // Supprimer la notification
    await this.prisma.notification.delete({
      where: { id },
    });

    // Invalider les caches
    await this.cacheManager.del(`notification:${id}`);
    await this.invalidateUserNotificationsCache(
      existingNotification.utilisateurId,
    );
  }

  // -------------------- MÉTHODES SPÉCIFIQUES --------------------
  async markAsRead(id: string): Promise<NotificationResponse> {
    // Vérifier si la notification existe
    const existingNotification = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (!existingNotification) {
      throw new NotFoundException(`Notification avec l'ID ${id} non trouvée`);
    }

    // Marquer comme lue
    const updatedNotification = await this.prisma.notification.update({
      where: { id },
      data: { lu: true },
    });

    // Invalider les caches
    await this.cacheManager.del(`notification:${id}`);
    await this.invalidateUserNotificationsCache(
      existingNotification.utilisateurId,
    );

    return updatedNotification as NotificationResponse; // Conversion explicite
  }

  async markAllAsRead(utilisateurId: string): Promise<void> {
    // Vérifier si l'utilisateur existe
    const utilisateur = await this.prisma.utilisateur.findUnique({
      where: { id: utilisateurId },
    });

    if (!utilisateur) {
      throw new NotFoundException(
        `Utilisateur avec l'ID ${utilisateurId} non trouvé`,
      );
    }

    // Marquer toutes les notifications comme lues
    await this.prisma.notification.updateMany({
      where: {
        utilisateurId,
        lu: false,
      },
      data: { lu: true },
    });

    // Invalider le cache des notifications de l'utilisateur
    await this.invalidateUserNotificationsCache(utilisateurId);
  }

  async getUnreadCount(utilisateurId: string): Promise<number> {
    const cacheKey = `notifications-unread-count:${utilisateurId}`;
    const cachedCount = await this.cacheManager.get(cacheKey);

    if (cachedCount !== undefined) {
      return cachedCount as number; // Conversion explicite du type
    }

    // Vérifier si l'utilisateur existe
    const utilisateur = await this.prisma.utilisateur.findUnique({
      where: { id: utilisateurId },
    });

    if (!utilisateur) {
      throw new NotFoundException(
        `Utilisateur avec l'ID ${utilisateurId} non trouvé`,
      );
    }

    // Compter les notifications non lues
    const count = await this.prisma.notification.count({
      where: {
        utilisateurId,
        lu: false,
      },
    });

    // Mettre en cache pour 1 minute
    await this.cacheManager.set(cacheKey, count, 60);

    return count;
  }

  async getStats(utilisateurId: string): Promise<NotificationStatsResponse> {
    const cacheKey = `notifications-stats:${utilisateurId}`;
    const cachedStats = await this.cacheManager.get(cacheKey);

    if (cachedStats) {
      return cachedStats as NotificationStatsResponse; // Conversion explicite
    }

    // Vérifier si l'utilisateur existe
    const utilisateur = await this.prisma.utilisateur.findUnique({
      where: { id: utilisateurId },
    });

    if (!utilisateur) {
      throw new NotFoundException(
        `Utilisateur avec l'ID ${utilisateurId} non trouvé`,
      );
    }

    // Récupérer les statistiques
    const [total, nonLues, notificationsByType] = await Promise.all([
      // Total des notifications
      this.prisma.notification.count({
        where: { utilisateurId },
      }),
      // Notifications non lues
      this.prisma.notification.count({
        where: {
          utilisateurId,
          lu: false,
        },
      }),
      // Notifications par type
      this.prisma.notification.groupBy({
        by: ['type'],
        where: { utilisateurId },
        _count: { type: true },
      }),
    ]);

    // Formater les statistiques par type
    const parType: { [key: string]: number } = {};
    notificationsByType.forEach((item) => {
      parType[item.type] = item._count.type;
    });

    const stats: NotificationStatsResponse = {
      total,
      nonLues,
      parType,
    };

    // Mettre en cache pour 5 minutes
    await this.cacheManager.set(cacheKey, stats, 300);

    return stats;
  }

  async createBulk(
    bulkNotificationDto: BulkNotificationDto,
  ): Promise<NotificationResponse[]> {
    const { utilisateurIds, titre, message, type, lien } = bulkNotificationDto;

    // Vérifier si tous les utilisateurs existent
    const utilisateurs = await this.prisma.utilisateur.findMany({
      where: {
        id: { in: utilisateurIds },
        statut: 'ACTIF', // Uniquement les utilisateurs actifs
      },
    });

    if (utilisateurs.length !== utilisateurIds.length) {
      throw new NotFoundException('Un ou plusieurs utilisateurs non trouvés');
    }

    // Créer les notifications en masse
    const notifications = await Promise.all(
      utilisateurs.map((utilisateur) =>
        this.prisma.notification.create({
          data: {
            utilisateurId: utilisateur.id,
            titre,
            message,
            type,
            lien,
          },
        }),
      ),
    );

    // Invalider le cache pour tous les utilisateurs concernés
    await Promise.all(
      utilisateurs.map((utilisateur) =>
        this.invalidateUserNotificationsCache(utilisateur.id),
      ),
    );

    return notifications as NotificationResponse[]; // Conversion explicite
  }

  async deleteOldNotifications(
    daysOld: number = 30,
  ): Promise<{ count: number }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    // Supprimer les anciennes notifications
    const result = await this.prisma.notification.deleteMany({
      where: {
        creeLe: { lt: cutoffDate },
        lu: true, // Uniquement les notifications lues
      },
    });

    // Invalider tout le cache des notifications
    await this.invalidateAllNotificationsCache();

    return { count: result.count };
  }

  // -------------------- MÉTHODES UTILITAIRES --------------------
  private async invalidateUserNotificationsCache(
    utilisateurId: string,
  ): Promise<void> {
    try {
      // Invalider tous les caches liés aux notifications de cet utilisateur
      const patterns = [
        `notifications:*utilisateurId:${utilisateurId}*`,
        `notifications-unread-count:${utilisateurId}`,
        `notifications-stats:${utilisateurId}`,
      ];

      for (const pattern of patterns) {
        await this.cacheManager.del(pattern);
      }
    } catch (error) {
      console.error(
        "❌ Erreur lors de l'invalidation du cache des notifications:",
        error,
      );
    }
  }

  private async invalidateAllNotificationsCache(): Promise<void> {
    try {
      // Invalider tous les caches liés aux notifications
      if (
        'stores' in this.cacheManager &&
        Array.isArray(this.cacheManager.stores) &&
        this.cacheManager.stores.length > 0
      ) {
        const store = this.cacheManager.stores[0];

        if ('keys' in store && typeof store.keys === 'function') {
          const keys = await store.keys('notifications:*');
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
        "❌ Erreur lors de l'invalidation du cache des notifications:",
        error,
      );
    }
  }
}
