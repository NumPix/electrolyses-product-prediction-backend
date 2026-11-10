import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ElectrolysesService } from './electrolyses.service';
import { Compound } from './entities/compound.entity';
import { ElectrolysesUser } from './entities/electrolyses-user.entity';
import { CompoundLike } from './entities/compound-like.entity';

describe('ElectrolysesService', () => {
  let service: ElectrolysesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ElectrolysesService,
        { provide: getRepositoryToken(Compound), useValue: {} },
        { provide: getRepositoryToken(ElectrolysesUser), useValue: {} },
        { provide: getRepositoryToken(CompoundLike), useValue: {} },
      ],
    }).compile();

    service = module.get<ElectrolysesService>(ElectrolysesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
