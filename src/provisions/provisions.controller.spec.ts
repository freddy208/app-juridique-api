import { Test, TestingModule } from '@nestjs/testing';
import { ProvisionsController } from './provisions.controller';

describe('ProvisionsController', () => {
  let controller: ProvisionsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProvisionsController],
    }).compile();

    controller = module.get<ProvisionsController>(ProvisionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
