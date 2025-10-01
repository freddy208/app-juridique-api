import { Module } from '@nestjs/common';
import { UtilisateursController } from './utilisateurs.controller';
import { UtilisateursService } from './utilisateurs.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [UtilisateursController],
  providers: [UtilisateursService, PrismaService],
})
export class UtilisateurModule {}
