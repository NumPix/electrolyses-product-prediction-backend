import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ElectrolysisService } from './electrolysis.service';
import { Compound } from './entities/compound.entity';
import { ElectrolysisUser } from './entities/electrolysis-user.entity';
import { CompoundLike } from './entities/compound-like.entity';

describe('ElectrolysisService', () => {
  let service: ElectrolysisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ElectrolysisService,
        { provide: getRepositoryToken(Compound), useValue: {} },
        { provide: getRepositoryToken(ElectrolysisUser), useValue: {} },
        { provide: getRepositoryToken(CompoundLike), useValue: {} },
      ],
    }).compile();

    service = module.get<ElectrolysisService>(ElectrolysisService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
