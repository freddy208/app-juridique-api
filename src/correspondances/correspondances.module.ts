// src/modules/correspondances/correspondance.module.ts

import { Module } from '@nestjs/common';
import { CorrespondanceService } from './correspondances.service';
import { CorrespondanceController } from './correspondances.controller';
import { PrismaService } from '../prisma.service';
import { PrismaModule } from '@/prisma.module';
import { AuthModule } from '@/auth/auth.module';
import { RedisModule } from '@/redis/redis.module';
import { UsersModule } from '@/users/users.module';
import { NotificationsModule } from '@/notifications/notifications.module';
import { PermissionsService } from '@/permissions/permissions.service';

@Module({
  imports: [
    PrismaModule,
    AuthModule, // 👈 AJOUTE CECI
    RedisModule,
    UsersModule,
    NotificationsModule,
  ],
  controllers: [CorrespondanceController],
  providers: [CorrespondanceService, PrismaService, PermissionsService],
  exports: [CorrespondanceService],
})
export class CorrespondanceModule {}
