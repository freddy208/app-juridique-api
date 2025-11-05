import { Module, forwardRef } from '@nestjs/common';
import { PrismaService } from '@/prisma.service';
import { PermissionsService } from '@/permissions/permissions.service';
import { PrismaModule } from '@/prisma.module';
import { AuthModule } from '@/auth/auth.module';
import { RedisModule } from '@/redis/redis.module';
import { UsersModule } from '@/users/users.module';
import { FacturesController } from './facturation.controller';
import { FacturesService } from './facturation.service';
import { HonorairesModule } from '../honoraires/honoraires.module';
import { PdfModule } from '../common/services/pdf.module';
import { ExcelModule } from '../common/services/excel.module';
import { EmailModule } from '../common/services/email.module';
import { PaiementsModule } from '@/paiments/paiments.module';
import { NotificationsModule } from '@/notifications/notifications.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    RedisModule,
    UsersModule,
    forwardRef(() => HonorairesModule),
    PdfModule,
    ExcelModule,
    EmailModule,
    PaiementsModule,
    NotificationsModule,
  ],
  controllers: [FacturesController],
  providers: [FacturesService, PrismaService, PermissionsService],
  exports: [FacturesService],
})
export class FacturationModule {}
