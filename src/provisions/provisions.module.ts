import { Module, forwardRef } from '@nestjs/common';
import { PrismaService } from '@/prisma.service';
import { PermissionsService } from '@/permissions/permissions.service';
import { PrismaModule } from '@/prisma.module';
import { AuthModule } from '@/auth/auth.module';
import { RedisModule } from '@/redis/redis.module';
import { UsersModule } from '@/users/users.module';
import { ProvisionsController } from './provisions.controller';
import { ProvisionsService } from './provisions.service';
import { DossiersModule } from '../dossiers/dossiers.module';
import { ClientModule } from '../clients/clients.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    RedisModule,
    UsersModule,
    forwardRef(() => DossiersModule),
    forwardRef(() => ClientModule),
    forwardRef(() => NotificationsModule),
  ],
  controllers: [ProvisionsController],
  providers: [ProvisionsService, PrismaService, PermissionsService],
  exports: [ProvisionsService],
})
export class ProvisionsModule {}
