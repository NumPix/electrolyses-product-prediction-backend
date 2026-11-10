import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ElectrolyteSolution } from '../entities/electrolyte-solution.entity';
import { ElectrolyteSolutionLike } from '../entities/electrolyte-solution-like.entity';
import { MinioService } from '../minio/minio.service';
import { ElectrolysesSerializer } from './electrolyses.serializer';
import { ElectrolysesService } from './electrolyses.service';

describe('ElectrolysesService', () => {
  let service: ElectrolysesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ElectrolysesService,
        { provide: getRepositoryToken(ElectrolyteSolution), useValue: {} },
        { provide: getRepositoryToken(ElectrolyteSolutionLike), useValue: {} },
        { provide: MinioService, useValue: {} },
        { provide: ElectrolysesSerializer, useValue: {} },
      ],
    }).compile();

    service = module.get<ElectrolysesService>(ElectrolysesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
