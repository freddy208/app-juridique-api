import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma.service';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './constants';
import { JwtStrategy } from './strategies/jwt.strategy';
import { MailService } from '../mail/mail.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  controllers: [AuthController],
  providers: [AuthService, PrismaService, JwtStrategy, MailService],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // rend les variables d'environnement accessibles partout
    }),
    JwtModule.register({
      secret: jwtConstants.secret,
    }),
  ],
})
export class AuthModule {}
