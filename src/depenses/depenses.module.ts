// src/depenses/depenses.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { PrismaService } from '@/prisma.service';
import { PermissionsService } from '@/permissions/permissions.service';
import { PrismaModule } from '@/prisma.module';
import { AuthModule } from '@/auth/auth.module';
import { RedisModule } from '@/redis/redis.module';
import { UsersModule } from '@/users/users.module';
import { DepensesController } from './depenses.controller';
import { DepensesService } from './depenses.service';
import { NotificationsModule } from '@/notifications/notifications.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    RedisModule,
    UsersModule,
    forwardRef(() => NotificationsModule),
  ],
  controllers: [DepensesController],
  providers: [DepensesService, PrismaService, PermissionsService],
  exports: [DepensesService],
})
export class DepensesModule {}
