// src/permissions/permissions.module.ts
import { Module } from '@nestjs/common';
import { PermissionsController } from './permissions.controller';
import { PermissionsService } from './permissions.service';
import { PermissionsGuard } from './guards/permissions.guard';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [PermissionsController],
  providers: [PermissionsService, PermissionsGuard, PrismaService],
  exports: [PermissionsService, PermissionsGuard],
})
export class PermissionsModule {}
