import { Module } from '@nestjs/common';
import { PrismaService } from '@/prisma.service';
import { PermissionsService } from '../permissions/permissions.service';
import { RedisModule } from '../redis/redis.module';
import { UsersModule } from '@/users/users.module';
import { PrismaModule } from '@/prisma.module';
import { AuthModule } from '@/auth/auth.module';
import { NotificationsModule } from '@/notifications/notifications.module';
import { EvenementsController } from './evenement-calendrier.controller';
import { EvenementsService } from './evenement-calendrier.service';

@Module({
  imports: [
    PrismaModule,
    AuthModule, // 👈 AJOUTE CECI
    RedisModule,
    UsersModule,
    NotificationsModule,
  ],
  controllers: [EvenementsController],
  providers: [EvenementsService, PrismaService, PermissionsService],
  exports: [EvenementsService],
})
export class EvenementCalendrierModule {}
