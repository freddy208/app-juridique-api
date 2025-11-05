import { Test, TestingModule } from '@nestjs/testing';
import { CommentairesController } from './commentaires.controller';

describe('CommentairesController', () => {
  let controller: CommentairesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CommentairesController],
    }).compile();

    controller = module.get<CommentairesController>(CommentairesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
