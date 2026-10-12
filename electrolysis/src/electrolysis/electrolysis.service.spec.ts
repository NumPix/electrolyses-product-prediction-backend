import { Test, TestingModule } from '@nestjs/testing';
import { ElectrolysisService } from './electrolysis.service';

describe('ElectrolysisService', () => {
  let service: ElectrolysisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ElectrolysisService],
    }).compile();

    service = module.get<ElectrolysisService>(ElectrolysisService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
