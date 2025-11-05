import { Test, TestingModule } from '@nestjs/testing';
import { HonorairesService } from './honoraires.service';

describe('HonorairesService', () => {
  let service: HonorairesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HonorairesService],
    }).compile();

    service = module.get<HonorairesService>(HonorairesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
