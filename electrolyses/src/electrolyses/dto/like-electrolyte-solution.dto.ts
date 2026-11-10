import { Type } from 'class-transformer';
import { IsIn } from 'class-validator';

export class LikeElectrolyteSolutionDto {
  @Type(() => Number)
  @IsIn([0, 1])
  like: 0 | 1;
}
