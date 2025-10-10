import { Module } from '@nestjs/common';
import { EvenementsService } from './evenements.service';
import { EvenementsController } from './evenements.controller';
import { PrismaService } from '../prisma.service';

@Module({
  providers: [EvenementsService, PrismaService],
  controllers: [EvenementsController],
})
export class EvenementsModule {}
