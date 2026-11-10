import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ElectrolysesService } from './electrolyses.service';
import { ElectrolysesController } from './electrolyses.controller';
import { Compound } from './entities/compound.entity';
import { ElectrolysesUser } from './entities/electrolyses-user.entity';
import { CompoundLike } from './entities/compound-like.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Compound, ElectrolysesUser, CompoundLike])],
  controllers: [ElectrolysesController],
  providers: [ElectrolysesService],
})
export class ElectrolysesModule {}
