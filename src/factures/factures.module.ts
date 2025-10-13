import { Module } from '@nestjs/common';
import { FacturesService } from './factures.service';
import { FacturesController } from './factures.controller';
import { PrismaService } from '../prisma.service';

@Module({
  providers: [FacturesService, PrismaService],
  controllers: [FacturesController],
})
export class FacturesModule {}
