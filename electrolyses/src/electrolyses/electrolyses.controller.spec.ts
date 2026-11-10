import { Test, TestingModule } from '@nestjs/testing';
import { ElectrolysesController } from './electrolyses.controller';

describe('ElectrolysesController', () => {
  let controller: ElectrolysesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ElectrolysesController],
    }).compile();

    controller = module.get<ElectrolysesController>(ElectrolysesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
