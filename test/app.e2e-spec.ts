import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
<<<<<<< HEAD
=======
import { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest'; // ✅ import par défaut

>>>>>>> origin/main
import { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest'; // ✅ import correct
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication & NestExpressApplication;
  let moduleFixture: TestingModule;

<<<<<<< HEAD
  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
=======
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication & NestExpressApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
>>>>>>> origin/main
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestExpressApplication>();
    await app.init();
  });
<<<<<<< HEAD
=======

  afterAll(async () => {
    await app.close();
  });

  it('/ (GET)', async () => {
    const response = await request(app.getHttpServer()).get('/').expect(200);

    expect(response.text).toBe('Hello World!');
>>>>>>> origin/main

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
