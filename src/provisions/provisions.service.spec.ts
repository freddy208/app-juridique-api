import { Test, TestingModule } from '@nestjs/testing';
import { ProvisionsService } from './provisions.service';

describe('ProvisionsService', () => {
  let service: ProvisionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProvisionsService],
    }).compile();

    service = module.get<ProvisionsService>(ProvisionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
