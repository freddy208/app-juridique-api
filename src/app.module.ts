import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ClientModule } from './clients/clients.module';
import { NoteModule } from './notes/notes.module';
import { CorrespondanceService } from './correspondances/correspondances.service';
import { CorrespondanceController } from './correspondances/correspondances.controller';
import { CorrespondanceModule } from './correspondances/correspondances.module';
import { TachesModule } from './taches/taches.module';
import { EvenementCalendrierModule } from './evenement-calendrier/evenement-calendrier.module';
import { NotificationsModule } from './notifications/notifications.module';
import { CommentairesModule } from './commentaires/commentaires.module';
import { MessagerieController } from './messagerie/messagerie.controller';
import { MessagerieModule } from './messagerie/messagerie.module';
import { ProceduresService } from './procedures/procedures.service';
import { ProceduresController } from './procedures/procedures.controller';
import { ProceduresModule } from './procedures/procedures.module';
import { JurisprudenceController } from './juriprudence/juriprudence.controller';
import { JurisprudenceService } from './juriprudence/juriprudence.service';
import { JurisprudenceModule } from './juriprudence/juriprudence.module';
import { HonorairesModule } from './honoraires/honoraires.module';
import { FacturesController } from './facturation/facturation.controller';
import { FacturationModule } from './facturation/facturation.module';
import { PaiementsService } from './paiments/paiments.service';
import { PaiementsModule } from './paiments/paiments.module';
import { DepensesModule } from './depenses/depenses.module';
import { ProvisionsService } from './provisions/provisions.service';
import { ProvisionsController } from './provisions/provisions.controller';
import { ProvisionsModule } from './provisions/provisions.module';
import { DossiersModule } from './dossiers/dossiers.module';
import { DocumentsService } from './documents/documents.service';
import { DocumentsController } from './documents/documents.controller';
import { DocumentsModule } from './documents/documents.module';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import emailConfig from './config/email.config';
import cloudinaryConfig from './config/cloudinary.config';
import mobileMoneyConfig from './config/mobile-money.config';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { DashboardController } from './dashboard/dashboard.controller';
import { DashboardModule } from './dashboard/dashboard.module';
import { StatistiquesService } from './statistiques/statistiques.service';
import { StatistiquesController } from './statistiques/statistiques.controller';
import { StatistiquesModule } from './statistiques/statistiques.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        appConfig,
        databaseConfig,
        jwtConfig,
        emailConfig,
        cloudinaryConfig,
        mobileMoneyConfig,
      ],
      envFilePath: '.env',
    }),

    // Limitation de débit
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: Number(config.get('THROTTLE_TTL')) || 60,
            limit: Number(config.get('THROTTLE_LIMIT')) || 10,
          },
        ],
      }),
    }),

    // Base de données
    PrismaModule,

    AuthModule,

    UsersModule,

    ClientModule,

    NoteModule,

    CorrespondanceModule,

    TachesModule,

    EvenementCalendrierModule,

    FacturationModule,

    NotificationsModule,

    CommentairesModule,

    MessagerieModule,

    ProceduresModule,

    JurisprudenceModule,

    HonorairesModule,

    FacturationModule,

    PaiementsModule,

    DepensesModule,

    ProvisionsModule,

    DossiersModule,

    DocumentsModule,

    CloudinaryModule,

    DashboardModule,

    StatistiquesModule,
  ],
  providers: [
    CorrespondanceService,
    ProceduresService,
    JurisprudenceService,
    PaiementsService,
    ProvisionsService,
    DocumentsService,
    StatistiquesService,
  ],
  controllers: [
    CorrespondanceController,
    MessagerieController,
    ProceduresController,
    JurisprudenceController,
    FacturesController,
    ProvisionsController,
    DocumentsController,
    DashboardController,
    StatistiquesController,
  ],
})
export class AppModule {}
