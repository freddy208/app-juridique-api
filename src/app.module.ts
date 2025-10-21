// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UtilisateurModule } from './utilisateur/utilisateurs.module';
import { ClientsModule } from './clients/clients.module';
import { DossiersModule } from './dossiers/dossiers.module';
import { DocumentsModule } from './documents/documents.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { TachesModule } from './taches/taches.module';
import { EvenementsModule } from './evenements/evenements.module';
import { MessagesModule } from './messages/messages.module';
import { FacturesModule } from './factures/factures.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { PermissionsModule } from './permissions/permissions.module';

// Importation correcte du module de cache
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-store';

@Module({
  imports: [
    // Configuration du CacheModule
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    CacheModule.register({
      isGlobal: true, // Rend le cache disponible dans toute l'application
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      store: redisStore as any, // 'as any' est un contournement courant pour les types
      host: 'localhost',
      port: 6379,
      ttl: 600, // Durée de vie par défaut du cache en secondes
    }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    UtilisateurModule,
    ClientsModule,
    DossiersModule,
    DocumentsModule,
    CloudinaryModule,
    TachesModule,
    EvenementsModule,
    MessagesModule,
    FacturesModule,
    DashboardModule,
    PermissionsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
