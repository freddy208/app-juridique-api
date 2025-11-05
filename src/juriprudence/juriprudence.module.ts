import { Module } from '@nestjs/common';
import { PrismaService } from '@/prisma.service';
import { PermissionsService } from '@/permissions/permissions.service';
import { PrismaModule } from '@/prisma.module';
import { AuthModule } from '@/auth/auth.module';
import { RedisModule } from '@/redis/redis.module';
import { UsersModule } from '@/users/users.module';
import { JurisprudenceController } from './juriprudence.controller';
import { JurisprudenceService } from './juriprudence.service';

@Module({
  imports: [PrismaModule, AuthModule, RedisModule, UsersModule],
  controllers: [JurisprudenceController],
  providers: [JurisprudenceService, PrismaService, PermissionsService],
  exports: [JurisprudenceService],
})
export class JurisprudenceModule {}
