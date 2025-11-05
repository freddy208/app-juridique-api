// src/modules/correspondances/correspondance.module.ts

import { forwardRef, Module } from '@nestjs/common';
import { NotesService } from './notes.service';
import { NotesController } from './notes.controller';
import { PrismaService } from '../prisma.service';
import { PermissionsService } from '../permissions/permissions.service';
import { RedisModule } from '../redis/redis.module';
import { UsersModule } from '@/users/users.module';
import { PrismaModule } from '@/prisma.module';
import { AuthModule } from '@/auth/auth.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule, // 👈 AJOUTE CECI
    RedisModule,
    forwardRef(() => UsersModule),
  ],
  controllers: [NotesController],
  providers: [NotesService, PrismaService, PermissionsService],
  exports: [NotesService],
})
export class NoteModule {}
