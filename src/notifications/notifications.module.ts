import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

import { PermissionsService } from '../permissions/permissions.service';

import { PrismaService } from '@/prisma.service';
import { RedisModule } from '../redis/redis.module';
import { PrismaModule } from '@/prisma.module';
import { AuthModule } from '@/auth/auth.module';
import { UsersModule } from '@/users/users.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule, // 👈 AJOUTE CECI
    RedisModule,
    UsersModule,
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, PrismaService, PermissionsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
