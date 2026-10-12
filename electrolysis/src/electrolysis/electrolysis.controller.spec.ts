import { Test, TestingModule } from '@nestjs/testing';
import { ElectrolysisController } from './electrolysis.controller';

describe('ElectrolysisController', () => {
  let controller: ElectrolysisController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ElectrolysisController],
    }).compile();

    controller = module.get<ElectrolysisController>(ElectrolysisController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
