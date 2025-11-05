import { Test, TestingModule } from '@nestjs/testing';
import { EvenementsController } from './evenement-calendrier.controller';

describe('EvenementsController', () => {
  let controller: EvenementsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EvenementsController],
    }).compile();

    controller = module.get<EvenementsController>(EvenementsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
