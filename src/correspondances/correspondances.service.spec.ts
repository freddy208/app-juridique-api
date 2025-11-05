import { Test, TestingModule } from '@nestjs/testing';
import { CorrespondanceService } from './correspondances.service';

describe('CorrespondancesService', () => {
  let service: CorrespondanceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CorrespondanceService],
    }).compile();

    service = module.get<CorrespondanceService>(CorrespondanceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
