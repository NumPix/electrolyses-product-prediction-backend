import { Module } from '@nestjs/common';
import { ElectrolysisController } from './electrolysis/electrolysis.controller';
import { ElectrolysisModule } from './electrolysis/electrolysis.module';

@Module({
  imports: [ElectrolysisModule],
  controllers: [ElectrolysisController],
  providers: [],
})
export class AppModule {}
