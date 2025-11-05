import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaModule } from '../prisma.module';
import { AuthModule } from '../auth/auth.module'; // 👈 IMPORT
import { PermissionsService } from '../permissions/permissions.service';
import { PrismaService } from '@/prisma.service';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule, // 👈 AJOUTE CECI
    RedisModule,
  ],
  controllers: [UsersController],
  providers: [UsersService, PrismaService, PermissionsService],
  exports: [UsersService],
})
export class UsersModule {}
