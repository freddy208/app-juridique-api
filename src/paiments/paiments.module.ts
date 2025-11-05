import { Module } from '@nestjs/common';
import { PaiementsController } from './paiments.controller';
import { PaiementsService } from './paiments.service';
import { PrismaModule } from '../prisma.module';
import { AuthModule } from '../auth/auth.module';
import { RedisModule } from '../redis/redis.module';
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    RedisModule,
    UsersModule,
    NotificationsModule,
  ],
  controllers: [PaiementsController],
  providers: [PaiementsService],
  exports: [PaiementsService], // Exporter le service pour qu'il soit réutilisable
})
export class PaiementsModule {}
