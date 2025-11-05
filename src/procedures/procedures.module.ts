import { forwardRef, Module } from '@nestjs/common';
import { PrismaService } from '@/prisma.service';
import { PermissionsService } from '@/permissions/permissions.service';
import { PrismaModule } from '@/prisma.module';
import { AuthModule } from '@/auth/auth.module';
import { RedisModule } from '@/redis/redis.module';
import { UsersModule } from '@/users/users.module';
import { NotificationsModule } from '@/notifications/notifications.module';
import { ProceduresController } from './procedures.controller';
import { ProceduresService } from './procedures.service';
import { EvenementCalendrierModule } from '@/evenement-calendrier/evenement-calendrier.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule, // 👈 AJOUTE CECI
    RedisModule,
    UsersModule,
    NotificationsModule,
    forwardRef(() => EvenementCalendrierModule), // <- si circularité
  ],

  controllers: [ProceduresController],
  providers: [ProceduresService, PrismaService, PermissionsService],
  exports: [ProceduresService],
})
export class ProceduresModule {}
