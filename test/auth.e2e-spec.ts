// test/auth.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from 'src/prisma.service';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);

    // Créer un utilisateur de test dans la DB
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    await prisma.utilisateur.create({
      data: {
        email: 'test@example.com',
        prenom: 'Test',
        nom: 'User',
        motDePasse: await bcrypt.hash('1234', 10),
        role: 'ADMIN',
        statut: 'ACTIF',
      },
    });
  });

  afterAll(async () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    await prisma.utilisateur.deleteMany({});
    await app.close();
  });

  it('/auth/login (POST) should return JWT', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'test@example.com', motDePasse: '1234' })
      .expect(201);

    expect(response.body).toHaveProperty('access_token');
  });
});
