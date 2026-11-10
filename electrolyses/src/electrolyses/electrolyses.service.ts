import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Not, Repository } from 'typeorm';
import {
  ElectrolyteSolution,
  ElectrolyteSolutionStatus,
} from '../entities/electrolyte-solution.entity';
import { ElectrolyteSolutionLike } from '../entities/electrolyte-solution-like.entity';
import { getCurrentUser } from '../users/current-user';
import { MinioService } from '../minio/minio.service';
import { CreateElectrolyteSolutionDto } from './dto/create-electrolyte-solution.dto';
import { ElectrolyteSolutionFiltersDto } from './dto/electrolyte-solution-filters.dto';
import type {
  ElectrolyteSolutionMediaFiles,
  UploadedMediaFile,
} from './dto/electrolyte-solution-media-files';
import {
  ElectrolyteSolutionCardDto,
  ElectrolyteSolutionDto,
  ElectrolyteSolutionFeedDto,
  ElectrolyteSolutionLikesDto,
} from './dto/electrolyte-solution-response.dto';
import { LikeElectrolyteSolutionDto } from './dto/like-electrolyte-solution.dto';
import { PublishElectrolyteSolutionDto } from './dto/publish-electrolyte-solution.dto';
import {
  IMAGE_EXTENSIONS,
  MAX_IMAGE_SIZE,
  VIDEO_EXTENSIONS,
  generateMediaKey,
} from './electrolyte-solution-media';
import { ElectrolysesSerializer } from './electrolyses.serializer';

@Injectable()
export class ElectrolysesService {
  constructor(
    @InjectRepository(ElectrolyteSolution)
    private readonly electrolyses: Repository<ElectrolyteSolution>,
    @InjectRepository(ElectrolyteSolutionLike)
    private readonly likes: Repository<ElectrolyteSolutionLike>,
    private readonly minio: MinioService,
    private readonly serializer: ElectrolysesSerializer,
  ) {}

  async getPublishedElectrolyses(
    filters: ElectrolyteSolutionFiltersDto,
  ): Promise<ElectrolyteSolutionCardDto[]> {
    const currentUser = getCurrentUser();
    let min = filters.minAnodeCathodeMassRatio;
    let max = filters.maxAnodeCathodeMassRatio;

    if (min !== undefined && max !== undefined && min > max) {
      [min, max] = [max, min];
    }

    const query = this.electrolyses
      .createQueryBuilder('electrolyteSolution')
      .leftJoinAndSelect('electrolyteSolution.likes', 'electrolyteSolutionLike')
      .where('electrolyteSolution.status = :status', {
        status: ElectrolyteSolutionStatus.Published,
      });

    if (min !== undefined) {
      query.andWhere('electrolyteSolution.anodeCathodeMassRatio >= :min', { min });
    }
    if (max !== undefined) {
      query.andWhere('electrolyteSolution.anodeCathodeMassRatio <= :max', { max });
    }

    const electrolyses = await query
      .orderBy('electrolyteSolution.id', 'ASC')
      .getMany();

    return electrolyses.map((electrolyteSolution) =>
      this.serializer.toCard(
        electrolyteSolution,
        electrolyteSolution.likes.length,
        currentUser.id,
      ),
    );
  }

  async getElectrolyteSolutionFeed(
    id: number | undefined,
    next: boolean,
  ): Promise<ElectrolyteSolutionFeedDto> {
    const currentUser = getCurrentUser();
    const electrolyteSolution = await this.findFeedElectrolyteSolution(id, next);

    if (!electrolyteSolution) {
      throw new NotFoundException(
        id === undefined ? 'Опубликованных растворов нет' : `Раствор с id ${id} не найден`,
      );
    }

    const [likes, likedByCurrentUser] = await Promise.all([
      this.likes.countBy({ compoundId: electrolyteSolution.id }),
      this.likes.existsBy({
        compoundId: electrolyteSolution.id,
        userId: currentUser.id,
      }),
    ]);

    return this.serializer.toFeed(electrolyteSolution, likes, likedByCurrentUser);
  }

  async getDraft(): Promise<ElectrolyteSolutionDto> {
    const currentUser = getCurrentUser();

    return this.serializer.toDetails(await this.findDraft(currentUser.id));
  }

  async createDraft(
    dto: CreateElectrolyteSolutionDto,
    files: ElectrolyteSolutionMediaFiles | undefined,
  ): Promise<ElectrolyteSolutionDto> {
    const currentUser = getCurrentUser();
    const image = files?.image?.[0];
    const video = files?.video?.[0];

    if (!image || !video) {
      throw new BadRequestException('Приложите файлы: image — изображение, video — видео');
    }

    const imageExtension = IMAGE_EXTENSIONS[image.mimetype];
    const videoExtension = VIDEO_EXTENSIONS[video.mimetype];

    if (!imageExtension) {
      throw new BadRequestException('Изображение должно быть в формате jpg, png, webp или gif');
    }
    if (!videoExtension) {
      throw new BadRequestException('Видео должно быть в формате mp4, webm или mov');
    }
    if (image.size > MAX_IMAGE_SIZE) {
      throw new BadRequestException('Изображение должно быть не больше 5 МБ');
    }

    const hasDraft = await this.electrolyses.existsBy({
      creatorId: currentUser.id,
      status: ElectrolyteSolutionStatus.Draft,
    });
    if (hasDraft) {
      throw new ConflictException('У пользователя уже есть черновик');
    }

    const imageKey = generateMediaKey('image', imageExtension);
    const videoKey = generateMediaKey('video', videoExtension);

    try {
      await this.uploadMedia(imageKey, image);
      await this.uploadMedia(videoKey, video);

      const draft = await this.electrolyses.save(
        this.electrolyses.create({
          compoundName: dto.compoundName,
          shortDescription: null,
          status: ElectrolyteSolutionStatus.Draft,
          imageKey,
          videoKey,
          anodeCathodeMassRatio: null,
          concentrationPercent: null,
          formedAt: null,
          creatorId: currentUser.id,
        }),
      );

      return this.serializer.toDetails(draft);
    } catch (error) {
      await this.minio.removeQuietly(imageKey);
      await this.minio.removeQuietly(videoKey);

      if (isUniqueViolation(error)) {
        throw new ConflictException('У пользователя уже есть черновик');
      }
      throw error;
    }
  }

  async publishDraft(dto: PublishElectrolyteSolutionDto): Promise<ElectrolyteSolutionDto> {
    const currentUser = getCurrentUser();
    const draft = await this.findDraft(currentUser.id);

    draft.shortDescription = dto.shortDescription;
    draft.anodeCathodeMassRatio = dto.anodeCathodeMassRatio;
    draft.concentrationPercent = dto.concentrationPercent;
    draft.status = ElectrolyteSolutionStatus.Published;
    draft.formedAt = new Date();

    return this.serializer.toDetails(await this.electrolyses.save(draft));
  }

  async deleteElectrolyteSolution(id: number): Promise<void> {
    const currentUser = getCurrentUser();
    const electrolyteSolution = await this.findOwnElectrolyteSolution(id, currentUser.id);

    await this.electrolyses.update(electrolyteSolution.id, {
      status: ElectrolyteSolutionStatus.Deleted,
    });
  }

  async likeElectrolyteSolution(
    id: number,
    dto: LikeElectrolyteSolutionDto,
  ): Promise<ElectrolyteSolutionLikesDto> {
    const currentUser = getCurrentUser();
    const isPublished = await this.electrolyses.existsBy({
      id,
      status: ElectrolyteSolutionStatus.Published,
    });

    if (!isPublished) {
      throw new NotFoundException(`Раствор с id ${id} не найден`);
    }

    const like = { compoundId: id, userId: currentUser.id };

    if (dto.like === 1) {
      if (!(await this.likes.existsBy(like))) {
        await this.likes.insert(like).catch((error: unknown) => {
          if (!isUniqueViolation(error)) {
            throw error;
          }
        });
      }
    } else {
      await this.likes.delete(like);
    }

    return {
      id,
      likes: await this.likes.countBy({ compoundId: id }),
      likedByCurrentUser: dto.like,
    };
  }

  private async findFeedElectrolyteSolution(
    id: number | undefined,
    next: boolean,
  ): Promise<ElectrolyteSolution | null> {
    const published = { status: ElectrolyteSolutionStatus.Published };
    const first = () =>
      this.electrolyses.findOne({ where: published, order: { id: 'ASC' } });

    if (id === undefined) {
      return first();
    }

    if (next) {
      const nextElectrolyteSolution = await this.electrolyses.findOne({
        where: { ...published, id: MoreThan(id) },
        order: { id: 'ASC' },
      });

      return nextElectrolyteSolution ?? first();
    }

    return this.electrolyses.findOneBy({ ...published, id });
  }

  private async findDraft(creatorId: number): Promise<ElectrolyteSolution> {
    const draft = await this.electrolyses.findOneBy({
      creatorId,
      status: ElectrolyteSolutionStatus.Draft,
    });

    if (!draft) {
      throw new NotFoundException('У пользователя нет черновика');
    }

    return draft;
  }

  private async findOwnElectrolyteSolution(
    id: number,
    currentUserId: number,
  ): Promise<ElectrolyteSolution> {
    const electrolyteSolution = await this.electrolyses.findOneBy({
      id,
      status: Not(ElectrolyteSolutionStatus.Deleted),
    });

    if (!electrolyteSolution) {
      throw new NotFoundException(`Раствор с id ${id} не найден`);
    }
    if (electrolyteSolution.creatorId !== currentUserId) {
      throw new ForbiddenException('Изменять можно только свои растворы');
    }

    return electrolyteSolution;
  }

  private async uploadMedia(key: string, file: UploadedMediaFile): Promise<void> {
    try {
      await this.minio.upload(key, file.buffer, file.mimetype);
    } catch {
      throw new ServiceUnavailableException('Не удалось сохранить файл в MinIO');
    }
  }
}

function isUniqueViolation(error: unknown): boolean {
  const failure = error as { code?: string; driverError?: { code?: string } } | null;

  return failure?.code === '23505' || failure?.driverError?.code === '23505';
}
