import { Transform, Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsString, Max, Min } from 'class-validator';

export class PublishElectrolyteSolutionDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  shortDescription: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  anodeCathodeMassRatio: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  concentrationPercent: number;
}
