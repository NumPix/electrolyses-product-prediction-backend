import { Module } from '@nestjs/common';
import { ElectrolysesService } from './electrolyses.service';
import { ElectrolysesController } from './electrolyses.controller';

@Module({
  controllers: [ElectrolysesController],
  providers: [ElectrolysesService]
})
export class ElectrolysesModule {}
