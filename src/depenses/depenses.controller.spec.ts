import { Test, TestingModule } from '@nestjs/testing';
import { DepensesController } from './depenses.controller';

describe('DepensesController', () => {
  let controller: DepensesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DepensesController],
    }).compile();

    controller = module.get<DepensesController>(DepensesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
