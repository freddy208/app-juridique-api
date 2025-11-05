import { Test, TestingModule } from '@nestjs/testing';
import { CorrespondanceController } from './correspondances.controller';

describe('CorrespondancesController', () => {
  let controller: CorrespondanceController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CorrespondanceController],
    }).compile();

    controller = module.get<CorrespondanceController>(CorrespondanceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
