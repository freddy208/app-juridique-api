// src/dossiers/dossier.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { DossiersService } from './dossiers.service';
import { DossiersController } from './dossiers.controller';
import { PrismaModule } from '../prisma.module';
import { AuthModule } from '../auth/auth.module';
import { RedisModule } from '../redis/redis.module';
import { UsersModule } from '../users/users.module';
import { ClientModule } from '../clients/clients.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { DocumentsModule } from '../documents/documents.module';
import { TachesModule } from '../taches/taches.module';
import { NoteModule } from '../notes/notes.module';
import { HonorairesModule } from '../honoraires/honoraires.module';
import { DepensesModule } from '../depenses/depenses.module';
import { ProvisionsModule } from '../provisions/provisions.module';
import { FacturationModule } from '../facturation/facturation.module';
import { PrismaService } from '@/prisma.service';
import { PermissionsService } from '@/permissions/permissions.service';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    RedisModule,
    UsersModule,
    forwardRef(() => ClientModule),
    forwardRef(() => NotificationsModule),
    DocumentsModule,
    TachesModule,
    NoteModule,
    HonorairesModule,
    DepensesModule,
    ProvisionsModule,
    FacturationModule,
  ],
  controllers: [DossiersController],
  providers: [DossiersService, PrismaService, PermissionsService],
  exports: [DossiersService],
})
export class DossiersModule {}
