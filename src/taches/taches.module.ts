import { forwardRef, Module } from '@nestjs/common';
import { TachesController } from './taches.controller';
import { TachesService } from './taches.service';
import { PrismaService } from '../prisma.service';
import { PermissionsService } from '../permissions/permissions.service';
import { RedisModule } from '../redis/redis.module';
import { UsersModule } from '@/users/users.module';
import { PrismaModule } from '@/prisma.module';
import { AuthModule } from '@/auth/auth.module';
import { NotificationsModule } from '@/notifications/notifications.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule, // 👈 AJOUTE CECI
    RedisModule,
    UsersModule,
    forwardRef(() => NotificationsModule), // <--- ici
  ],
  controllers: [TachesController],
  providers: [TachesService, PrismaService, PermissionsService],
  exports: [TachesService],
})
export class TachesModule {}
