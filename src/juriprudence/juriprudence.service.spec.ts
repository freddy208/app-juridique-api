import { Test, TestingModule } from '@nestjs/testing';
import { JurisprudenceService } from './juriprudence.service';

describe('JuriprudenceService', () => {
  let service: JurisprudenceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JurisprudenceService],
    }).compile();

    service = module.get<JurisprudenceService>(JurisprudenceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
