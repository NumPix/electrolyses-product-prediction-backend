import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

export class ElectrolyteSolutionFeedQueryDto {
  @IsOptional()
  @Transform(({ value }) => (value === 'true' ? true : value === 'false' ? false : value))
  @IsBoolean()
  next?: boolean;
}
