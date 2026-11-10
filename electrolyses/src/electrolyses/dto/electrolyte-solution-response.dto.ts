import { ElectrolyteSolutionStatus } from '../../entities/electrolyte-solution.entity';

export class ElectrolyteSolutionCardDto {
  id: number;
  compoundName: string;
  imageUrl: string;
  anodeCathodeMassRatio: number | null;
  concentrationPercent: number | null;
  likes: number;
  createdByCurrentUser: 0 | 1;
}

export class ElectrolyteSolutionFeedDto {
  id: number;
  compoundName: string;
  shortDescription: string | null;
  imageUrl: string;
  videoUrl: string;
  anodeCathodeMassRatio: number | null;
  concentrationPercent: number | null;
  likes: number;
  likedByCurrentUser: 0 | 1;
}

export class ElectrolyteSolutionDto {
  id: number;
  compoundName: string;
  shortDescription: string | null;
  status: ElectrolyteSolutionStatus;
  imageUrl: string;
  videoUrl: string;
  anodeCathodeMassRatio: number | null;
  concentrationPercent: number | null;
  createdAt: Date;
  formedAt: Date | null;
}

export class ElectrolyteSolutionLikesDto {
  id: number;
  likes: number;
  likedByCurrentUser: 0 | 1;
}
