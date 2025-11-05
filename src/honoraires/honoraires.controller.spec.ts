import { Test, TestingModule } from '@nestjs/testing';
import { HonorairesController } from './honoraires.controller';

describe('HonorairesController', () => {
  let controller: HonorairesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HonorairesController],
    }).compile();

    controller = module.get<HonorairesController>(HonorairesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
