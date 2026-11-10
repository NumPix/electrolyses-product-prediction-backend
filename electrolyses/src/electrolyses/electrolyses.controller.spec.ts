import { Test, TestingModule } from '@nestjs/testing';
import { ElectrolysesController } from './electrolyses.controller';
import { ElectrolysesService } from './electrolyses.service';

describe('ElectrolysesController', () => {
  let controller: ElectrolysesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ElectrolysesController],
      providers: [
        {
          provide: ElectrolysesService,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<ElectrolysesController>(ElectrolysesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
