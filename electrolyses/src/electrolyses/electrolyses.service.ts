import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { Compound, CompoundStatus } from './entities/compound.entity';
import { ElectrolysesUser } from './entities/electrolyses-user.entity';
import { CompoundLike } from './entities/compound-like.entity';

export const PLACEHOLDER_IMAGE_KEY = 'default-compound.jpg';
export const PLACEHOLDER_VIDEO_KEY = 'default-compound.mp4';

@Injectable()
export class ElectrolysesService {
  constructor(
    @InjectRepository(Compound)
    private readonly compounds: Repository<Compound>,
    @InjectRepository(ElectrolysesUser)
    private readonly users: Repository<ElectrolysesUser>,
    @InjectRepository(CompoundLike)
    private readonly likes: Repository<CompoundLike>,
  ) {}

  async getPublishedCompounds(
    minAnodeCathodeMassRatio: number | null,
    maxAnodeCathodeMassRatio: number | null,
  ): Promise<Compound[]> {
    const query = this.compounds
      .createQueryBuilder('compound')
      .leftJoinAndSelect('compound.likes', 'likes')
      .where('compound.status = :status', {
        status: CompoundStatus.Published,
      });

    if (minAnodeCathodeMassRatio !== null) {
      query.andWhere('compound.anodeCathodeMassRatio >= :minAnodeCathodeMassRatio', {
        minAnodeCathodeMassRatio,
      });
    }
    if (maxAnodeCathodeMassRatio !== null) {
      query.andWhere('compound.anodeCathodeMassRatio <= :maxAnodeCathodeMassRatio', {
        maxAnodeCathodeMassRatio,
      });
    }

    return query.orderBy('compound.id', 'ASC').getMany();
  }

  async getPublishedCompoundById(id: number): Promise<Compound | null> {
    return this.compounds.findOne({
      where: { id, status: CompoundStatus.Published },
      relations: { likes: true },
    });
  }

  async getFirstPublishedCompoundId(): Promise<number | null> {
    const compound = await this.compounds.findOne({
      where: { status: CompoundStatus.Published },
      select: { id: true },
      order: { id: 'ASC' },
    });

    return compound?.id ?? null;
  }

  async getNextPublishedCompoundId(currentId: number): Promise<number | null> {
    const next = await this.compounds.findOne({
      where: {
        id: MoreThanOrEqual(currentId + 1),
        status: CompoundStatus.Published,
      },
      select: { id: true },
      order: { id: 'ASC' },
    });

    if (next) return next.id;
    return this.getFirstPublishedCompoundId();
  }

  async getDraftByCreator(creatorId: number): Promise<Compound | null> {
    return this.compounds.findOne({
      where: {
        status: CompoundStatus.Draft,
        creator: { id: creatorId },
      },
      relations: { creator: true, likes: true },
      order: { id: 'ASC' },
    });
  }

  async addDraft(
    creatorId: number,
    input: { name: string; imgSrc: string; vidSrc: string },
  ): Promise<Compound> {
    const name = input.name?.trim();

    if (!name) {
      throw new BadRequestException('Укажите название вещества.');
    }

    const existingDraft = await this.getDraftByCreator(creatorId);
    if (existingDraft) return existingDraft;

    const creator = await this.users.findOneBy({ id: creatorId });
    if (!creator) {
      throw new NotFoundException(
        'Пользователь не найден. Сначала выполните npm run migrate.',
      );
    }

    const draft = this.compounds.create({
      name,
      shortDescription: null,
      status: CompoundStatus.Draft,
      imgSrc: input.imgSrc,
      vidSrc: input.vidSrc,
      anodeCathodeMassRatio: null,
      concentration: null,
      formedAt: null,
      creator,
    });

    return this.compounds.save(draft);
  }

  async publishDraft(
    creatorId: number,
    input: { shortDescription: string; anodeCathodeMassRatio: number; concentration: number },
  ): Promise<Compound> {
    const shortDescription = input.shortDescription?.trim();

    if (!shortDescription) {
      throw new BadRequestException('Заполните краткое описание.');
    }
    if (!Number.isFinite(input.anodeCathodeMassRatio) || input.anodeCathodeMassRatio < 0) {
      throw new BadRequestException('Соотношение массы анода к массе катода должно быть неотрицательным числом.');
    }
    if (
      !Number.isFinite(input.concentration) ||
      input.concentration < 0 ||
      input.concentration > 100
    ) {
      throw new BadRequestException('Концентрация должна быть от 0 до 100%.');
    }

    const draft = await this.getDraftByCreator(creatorId);
    if (!draft) throw new NotFoundException('Черновик не найден.');

    draft.shortDescription = shortDescription;
    draft.anodeCathodeMassRatio = input.anodeCathodeMassRatio;
    draft.concentration = input.concentration;
    draft.status = CompoundStatus.Published;
    draft.formedAt = new Date();

    return this.compounds.save(draft);
  }

  async deleteCompound(id: number): Promise<boolean> {
    const rows: Array<{ id: number }> = await this.compounds.query(
      `UPDATE electrolyte_solutions
       SET status = $1
       WHERE id = $2 AND status <> $1
       RETURNING id`,
      [CompoundStatus.Deleted, id],
    );

    return rows.length > 0;
  }

  async countLikes(compoundId: number): Promise<number> {
    return this.likes.count({ where: { compoundId } });
  }
}
