import { Test, TestingModule } from '@nestjs/testing';
import { JurisprudenceController } from './juriprudence.controller';

describe('JuriprudenceController', () => {
  let controller: JurisprudenceController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [JurisprudenceController],
    }).compile();

    controller = module.get<JurisprudenceController>(JurisprudenceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
