import { Test, TestingModule } from '@nestjs/testing';
import { ElectrolysesService } from './electrolyses.service';

describe('ElectrolysesService', () => {
  let service: ElectrolysesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ElectrolysesService],
    }).compile();

    service = module.get<ElectrolysesService>(ElectrolysesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
