import { Test, TestingModule } from '@nestjs/testing';
import { CommentairesService } from './commentaires.service';

describe('CommentairesService', () => {
  let service: CommentairesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CommentairesService],
    }).compile();

    service = module.get<CommentairesService>(CommentairesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
