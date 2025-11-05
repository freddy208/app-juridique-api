import { Test, TestingModule } from '@nestjs/testing';
import { MessagerieService } from './messagerie.service';

describe('MessagerieService', () => {
  let service: MessagerieService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MessagerieService],
    }).compile();

    service = module.get<MessagerieService>(MessagerieService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
