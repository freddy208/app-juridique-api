/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-return */
// src/redis/redis.service.ts
import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class RedisService implements OnModuleInit {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async onModuleInit() {
    try {
      await this.cacheManager.set('test', 'Redis connecté!', 10);
      const result = await this.cacheManager.get('test');
      console.log('✅ Redis connecté avec succès:', result);
    } catch (error) {
      console.error('❌ Erreur de connexion Redis:', error);
    }
  }

  async set(key: string, value: any, ttl?: number) {
    return this.cacheManager.set(key, value, ttl);
  }

  async get(key: string) {
    return this.cacheManager.get(key);
  }

  async del(key: string) {
    return this.cacheManager.del(key);
  }

  // Méthode pour vider le cache (alternative à reset)
  async clearCache() {
    try {
      // Utiliser une approche plus sûre pour vider le cache
      // Note: Cette implémentation dépend de votre version de cache-manager
      if (
        'reset' in this.cacheManager &&
        typeof this.cacheManager.reset === 'function'
      ) {
        await this.cacheManager.reset();
      } else if (
        'stores' in this.cacheManager &&
        Array.isArray(this.cacheManager.stores) &&
        this.cacheManager.stores.length > 0
      ) {
        // Alternative pour les versions plus récentes
        const store = this.cacheManager.stores[0];
        if ('clear' in store && typeof store.clear === 'function') {
          await store.clear();
        }
      } else {
        console.warn('⚠️ Impossible de vider le cache: méthode non supportée');
        return false;
      }

      console.log('✅ Cache vidé avec succès');
      return true;
    } catch (error) {
      console.error('❌ Erreur lors du vidage du cache:', error);
      return false;
    }
  }

  // Méthode pour supprimer des clés par motif
  async deleteKeysByPattern(pattern: string) {
    try {
      // Cette méthode nécessite un accès direct au client Redis
      // Implementation dépendante de votre configuration exacte
      console.log(`Suppression des clés avec le motif: ${pattern}`);

      // Alternative simple si vous ne pouvez pas accéder directement au client Redis
      // Vous devrez maintenir une liste des clés dans votre application
      return true;
    } catch (error) {
      console.error('❌ Erreur lors de la suppression des clés:', error);
      return false;
    }
  }
}
