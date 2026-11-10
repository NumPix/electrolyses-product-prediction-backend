import { Type } from 'class-transformer';
import { IsNumber, IsOptional, Min } from 'class-validator';

export class ElectrolyteSolutionFiltersDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minAnodeCathodeMassRatio?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxAnodeCathodeMassRatio?: number;
}
