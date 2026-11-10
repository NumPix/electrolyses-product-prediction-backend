import { Injectable } from '@nestjs/common';
import { ElectrolyteSolution } from '../entities/electrolyte-solution.entity';
import { MinioService } from '../minio/minio.service';
import {
  ElectrolyteSolutionCardDto,
  ElectrolyteSolutionDto,
  ElectrolyteSolutionFeedDto,
} from './dto/electrolyte-solution-response.dto';
import { DEFAULT_IMAGE_KEY, DEFAULT_VIDEO_KEY } from './electrolyte-solution-media';

@Injectable()
export class ElectrolysesSerializer {
  constructor(private readonly minio: MinioService) {}

  toCard(
    electrolyteSolution: ElectrolyteSolution,
    likes: number,
    currentUserId: number,
  ): ElectrolyteSolutionCardDto {
    return {
      id: electrolyteSolution.id,
      compoundName: electrolyteSolution.compoundName,
      imageUrl: this.imageUrl(electrolyteSolution),
      anodeCathodeMassRatio: electrolyteSolution.anodeCathodeMassRatio,
      concentrationPercent: electrolyteSolution.concentrationPercent,
      likes,
      createdByCurrentUser: electrolyteSolution.creatorId === currentUserId ? 1 : 0,
    };
  }

  toFeed(
    electrolyteSolution: ElectrolyteSolution,
    likes: number,
    likedByCurrentUser: boolean,
  ): ElectrolyteSolutionFeedDto {
    return {
      id: electrolyteSolution.id,
      compoundName: electrolyteSolution.compoundName,
      shortDescription: electrolyteSolution.shortDescription,
      imageUrl: this.imageUrl(electrolyteSolution),
      videoUrl: this.videoUrl(electrolyteSolution),
      anodeCathodeMassRatio: electrolyteSolution.anodeCathodeMassRatio,
      concentrationPercent: electrolyteSolution.concentrationPercent,
      likes,
      likedByCurrentUser: likedByCurrentUser ? 1 : 0,
    };
  }

  toDetails(electrolyteSolution: ElectrolyteSolution): ElectrolyteSolutionDto {
    return {
      id: electrolyteSolution.id,
      compoundName: electrolyteSolution.compoundName,
      shortDescription: electrolyteSolution.shortDescription,
      status: electrolyteSolution.status,
      imageUrl: this.imageUrl(electrolyteSolution),
      videoUrl: this.videoUrl(electrolyteSolution),
      anodeCathodeMassRatio: electrolyteSolution.anodeCathodeMassRatio,
      concentrationPercent: electrolyteSolution.concentrationPercent,
      createdAt: electrolyteSolution.createdAt,
      formedAt: electrolyteSolution.formedAt,
    };
  }

  private imageUrl(electrolyteSolution: ElectrolyteSolution): string {
    return this.minio.url(electrolyteSolution.imageKey || DEFAULT_IMAGE_KEY);
  }

  private videoUrl(electrolyteSolution: ElectrolyteSolution): string {
    return this.minio.url(electrolyteSolution.videoKey || DEFAULT_VIDEO_KEY);
  }
}
