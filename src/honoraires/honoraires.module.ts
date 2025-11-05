import { Module, forwardRef } from '@nestjs/common';
import { PrismaService } from '@/prisma.service';
import { PermissionsService } from '@/permissions/permissions.service';
import { PrismaModule } from '@/prisma.module';
import { AuthModule } from '@/auth/auth.module';
import { RedisModule } from '@/redis/redis.module';
import { UsersModule } from '@/users/users.module';
import { HonorairesController } from './honoraires.controller';
import { HonorairesService } from './honoraires.service';
import { FacturationModule } from '../facturation/facturation.module';
import { PaiementsModule } from '@/paiments/paiments.module';
import { NotificationsModule } from '@/notifications/notifications.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    RedisModule,
    UsersModule,
    forwardRef(() => FacturationModule),
    PaiementsModule,
    NotificationsModule,
  ],
  controllers: [HonorairesController],
  providers: [HonorairesService, PrismaService, PermissionsService],
  exports: [HonorairesService],
})
export class HonorairesModule {}
