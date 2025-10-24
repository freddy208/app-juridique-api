import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaModule } from '../prisma.module';
import { AuthModule } from '../auth/auth.module'; // 👈 IMPORT

@Module({
  imports: [
    PrismaModule,
    AuthModule, // 👈 AJOUTE CECI
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
