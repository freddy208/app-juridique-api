import { Test, TestingModule } from '@nestjs/testing';
import { MessagerieController } from './messagerie.controller';

describe('MessagerieController', () => {
  let controller: MessagerieController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MessagerieController],
    }).compile();

    controller = module.get<MessagerieController>(MessagerieController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
