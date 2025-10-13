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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // rend les variables d'environnement accessibles partout
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
