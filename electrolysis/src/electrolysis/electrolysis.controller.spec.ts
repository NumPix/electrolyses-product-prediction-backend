import { Test, TestingModule } from '@nestjs/testing';
import { ElectrolysisController } from './electrolysis.controller';
import { ElectrolysisService } from './electrolysis.service';

describe('ElectrolysisController', () => {
  let controller: ElectrolysisController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ElectrolysisController],
      providers: [
        {
          provide: ElectrolysisService,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<ElectrolysisController>(ElectrolysisController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
