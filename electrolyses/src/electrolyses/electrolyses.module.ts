import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ElectrolyteSolution } from '../entities/electrolyte-solution.entity';
import { ElectrolyteSolutionLike } from '../entities/electrolyte-solution-like.entity';
import { MinioService } from '../minio/minio.service';
import { ElectrolysesController } from './electrolyses.controller';
import { ElectrolysesSerializer } from './electrolyses.serializer';
import { ElectrolysesService } from './electrolyses.service';

@Module({
  imports: [TypeOrmModule.forFeature([ElectrolyteSolution, ElectrolyteSolutionLike])],
  controllers: [ElectrolysesController],
  providers: [ElectrolysesService, ElectrolysesSerializer, MinioService],
})
export class ElectrolysesModule {}
