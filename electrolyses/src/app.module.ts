import { Module } from '@nestjs/common';
import { ElectrolysesController } from './electrolyses/electrolyses.controller';
import { ElectrolysesModule } from './electrolyses/electrolyses.module';

@Module({
  imports: [ElectrolysesModule],
  controllers: [ElectrolysesController],
  providers: [],
})
export class AppModule {}
