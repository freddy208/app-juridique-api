import { Module, forwardRef } from '@nestjs/common';
import { ClientService } from './clients.service';
import { ClientController } from './clients.controller';
import { PrismaModule } from '../prisma.module';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { DossiersModule } from '../dossiers/dossiers.module';
import { PrismaService } from '@/prisma.service';
import { PermissionsService } from '@/permissions/permissions.service';

@Module({
  imports: [PrismaModule, CloudinaryModule, forwardRef(() => DossiersModule)],
  controllers: [ClientController],
  providers: [ClientService, PrismaService, PermissionsService],
  exports: [ClientService],
})
export class ClientModule {}
