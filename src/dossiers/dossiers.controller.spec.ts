import { Test, TestingModule } from '@nestjs/testing';
import { DossiersController } from './dossiers.controller';

describe('DossiersController', () => {
  let controller: DossiersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DossiersController],
    }).compile();

    controller = module.get<DossiersController>(DossiersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
