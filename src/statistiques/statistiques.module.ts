// src/statistiques/statistiques.module.ts
import { Module } from '@nestjs/common';
import { StatistiquesController } from './statistiques.controller';
import { StatistiquesService } from './statistiques.service';
import { PrismaModule } from '../prisma.module';
import { AuthModule } from '../auth/auth.module';
import { PrismaService } from '@/prisma.service';
import { PermissionsService } from '@/permissions/permissions.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [StatistiquesController],
  providers: [StatistiquesService, PrismaService, PermissionsService],
  exports: [StatistiquesService],
})
export class StatistiquesModule {}
