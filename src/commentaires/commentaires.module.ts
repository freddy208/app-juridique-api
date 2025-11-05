import { Module } from '@nestjs/common';
import { CommentairesService } from './commentaires.service';
import { CommentairesController } from './commentaires.controller';
import { PermissionsService } from '../permissions/permissions.service';
import { RedisModule } from '../redis/redis.module';
import { UsersModule } from '@/users/users.module';
import { PrismaModule } from '@/prisma.module';
import { AuthModule } from '@/auth/auth.module';
import { PrismaService } from '@/prisma.service';

@Module({
  imports: [
    PrismaModule,
    AuthModule, // 👈 AJOUTE CECI
    RedisModule,
    UsersModule,
  ],
  providers: [CommentairesService, PrismaService, PermissionsService],
  controllers: [CommentairesController],
})
export class CommentairesModule {}
