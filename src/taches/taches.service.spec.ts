import { Test, TestingModule } from '@nestjs/testing';
import { TachesService } from './taches.service';

describe('TachesService', () => {
  let service: TachesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TachesService],
    }).compile();

    service = module.get<TachesService>(TachesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
