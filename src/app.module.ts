import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UtilisateurModule } from './utilisateur/utilisateurs.module';
import { ClientsModule } from './clients/clients.module';
import { DossiersModule } from './dossiers/dossiers.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // rend les variables d'environnement accessibles partout
    }),
    AuthModule,
    UtilisateurModule,
    ClientsModule,
    DossiersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
