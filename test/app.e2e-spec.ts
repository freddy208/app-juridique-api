import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest'; // ✅ import correct
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication & NestExpressApplication;
  let moduleFixture: TestingModule;

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestExpressApplication>();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(async () => {
    await app.close();
    app = moduleFixture.createNestApplication<NestExpressApplication>();
    await app.init();
  });

  it('/ (GET)', async () => {
    const response = await request(app.getHttpServer()).get('/').expect(200);
    expect(response.text).toBe('Hello World!');
  });
});
