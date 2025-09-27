import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UtilisateurModule } from './utilisateur/utilisateur.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // rend les variables d'environnement accessibles partout
    }),
    AuthModule,
    UtilisateurModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
