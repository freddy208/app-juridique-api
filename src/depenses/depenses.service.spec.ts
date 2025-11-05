import { Test, TestingModule } from '@nestjs/testing';
import { DepensesService } from './depenses.service';

describe('DepensesService', () => {
  let service: DepensesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DepensesService],
    }).compile();

    service = module.get<DepensesService>(DepensesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
