import { Module } from '@nestjs/common';
import { ElectrolysisService } from './electrolysis.service';
import { ElectrolysisController } from './electrolysis.controller';

@Module({
  controllers: [ElectrolysisController],
  providers: [ElectrolysisService]
})
export class ElectrolysisModule {}
