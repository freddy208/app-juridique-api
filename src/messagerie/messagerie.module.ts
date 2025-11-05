import { Module } from '@nestjs/common';
import { MessagerieService } from './messagerie.service';
import { PrismaService } from '@/prisma.service';
import { PermissionsService } from '@/permissions/permissions.service';
import { PrismaModule } from '@/prisma.module';
import { AuthModule } from '@/auth/auth.module';
import { RedisModule } from '@/redis/redis.module';
import { UsersModule } from '@/users/users.module';
import { NotificationsModule } from '@/notifications/notifications.module';
import { MessagerieController } from './messagerie.controller';

@Module({
  imports: [
    PrismaModule,
    AuthModule, // 👈 AJOUTE CECI
    RedisModule,
    UsersModule,
    NotificationsModule,
  ],

  controllers: [MessagerieController],
  providers: [MessagerieService, PrismaService, PermissionsService],
  exports: [MessagerieService],
})
export class MessagerieModule {}
