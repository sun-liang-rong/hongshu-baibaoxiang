import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

interface HealthResponse {
  code: number;
  data: {
    status: string;
  };
}

describe('HealthController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    process.env.NODE_ENV = 'test';
    process.env.DATABASE_URL =
      'mysql://root:password@localhost:3306/redbook_toolbox_test';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/api/v1/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200)
      .expect(({ body }) => {
        const response = body as HealthResponse;
        expect(response.code).toBe(0);
        expect(response.data.status).toBe('ok');
      });
  });

  afterEach(async () => {
    await app.close();
  });
});
