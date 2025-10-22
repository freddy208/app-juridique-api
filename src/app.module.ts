import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma.module';
import { AuthModule } from './auth/auth.module';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import emailConfig from './config/email.config';
import cloudinaryConfig from './config/cloudinary.config';
import mobileMoneyConfig from './config/mobile-money.config';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        appConfig,
        databaseConfig,
        jwtConfig,
        emailConfig,
        cloudinaryConfig,
        mobileMoneyConfig,
      ],
      envFilePath: '.env',
    }),

    // Limitation de débit
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: Number(config.get('THROTTLE_TTL')) || 60,
            limit: Number(config.get('THROTTLE_LIMIT')) || 10,
          },
        ],
      }),
    }),

    // Base de données
    PrismaModule,

    AuthModule,
  ],
})
export class AppModule {}
