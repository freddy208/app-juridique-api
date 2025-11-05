// documents.module.ts
import { Module } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';
import { PrismaModule } from '../prisma.module';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from '@/prisma.service';
import { PermissionsService } from '@/permissions/permissions.service';
import { AuthModule } from '@/auth/auth.module';
import { RedisModule } from '@/redis/redis.module';

@Module({
  imports: [
    PrismaModule,
    CloudinaryModule,
    AuthModule,
    RedisModule,
    CacheModule.register({
      ttl: 600, // 10 minutes
      max: 100, // maximum number of items in cache
    }),
    ConfigModule,
  ],
  controllers: [DocumentsController],
  providers: [DocumentsService, PrismaService, PermissionsService],
  exports: [DocumentsService],
})
export class DocumentsModule {}
