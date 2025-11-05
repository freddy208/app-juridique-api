// src/dashboard/dashboard.module.ts
import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { PrismaModule } from '../prisma.module';
import { AuthModule } from '../auth/auth.module';
import { PrismaService } from '@/prisma.service';
import { PermissionsService } from '@/permissions/permissions.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [DashboardController],
  providers: [DashboardService, PrismaService, PermissionsService],
  exports: [DashboardService],
})
export class DashboardModule {}
