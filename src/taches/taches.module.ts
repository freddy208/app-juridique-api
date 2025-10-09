import { Module } from '@nestjs/common';
import { TachesService } from './taches.service';
import { TachesController } from './taches.controller';
import { PrismaService } from '../prisma.service';

@Module({
  providers: [TachesService, PrismaService],
  controllers: [TachesController],
  exports: [TachesService],
})
export class TachesModule {}
