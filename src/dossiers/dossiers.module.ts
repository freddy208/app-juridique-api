import { Module } from '@nestjs/common';
import { DossiersController } from './dossiers.controller';
import { DossiersService } from './dossiers.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [DossiersController],
  providers: [DossiersService, PrismaService],
})
export class DossiersModule {}
