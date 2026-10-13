import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ElectrolysisService } from './electrolysis.service';
import { ElectrolysisController } from './electrolysis.controller';
import { Compound } from './entities/compound.entity';
import { ElectrolysisUser } from './entities/electrolysis-user.entity';
import { CompoundLike } from './entities/compound-like.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Compound, ElectrolysisUser, CompoundLike])],
  controllers: [ElectrolysisController],
  providers: [ElectrolysisService],
})
export class ElectrolysisModule {}
