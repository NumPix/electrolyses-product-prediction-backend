import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  Redirect,
  Render,
} from '@nestjs/common';
import {
  ElectrolysesService,
  PLACEHOLDER_IMAGE_KEY,
  PLACEHOLDER_VIDEO_KEY,
} from './electrolyses.service';

const CURRENT_USER_ID = 1;

@Controller('electrolyses')
export class ElectrolysesController {
  private readonly minIOSrc = 'http://localhost:9000/media/';
  private readonly host = 'http://localhost:3000/electrolyses/';

  // Верхняя граница слайдера: у солей приложения соотношение не больше 35,2 (NaCl: m(Cl₂) / m(H₂))
  private readonly anodeCathodeMassRatioSliderMax = 40;

  constructor(private readonly electrolysesService: ElectrolysesService) { }

  @Get(['feed', 'feed/:id'])
  @Render('electrolysesFeed')
  async getCompoundById(
    @Param('id') id?: string,
    @Query('next') next?: string,
  ) {
    let compoundId: number | null;

    if (id === undefined) {
      compoundId = await this.electrolysesService.getFirstPublishedCompoundId();
    } else {
      const parsedId = Number.parseInt(id, 10);
      if (!Number.isSafeInteger(parsedId) || parsedId < 0) {
        throw new BadRequestException('Некорректный ID раствора.');
      }
      compoundId = parsedId;
      if (next === 'true') {
        compoundId = await this.electrolysesService.getNextPublishedCompoundId(parsedId);
      }
    }

    if (compoundId === null) {
      throw new NotFoundException('Опубликованные растворы не найдены.');
    }

    const compound = await this.electrolysesService.getPublishedCompoundById(compoundId);
    if (!compound) {
      throw new NotFoundException('Опубликованный раствор не найден.');
    }

    const item = {
      ...compound,
      imgSrc: this.minIOSrc + (compound.imgSrc || PLACEHOLDER_IMAGE_KEY),
      vidSrc: this.minIOSrc + (compound.vidSrc || PLACEHOLDER_VIDEO_KEY),
      likes: compound.likes?.length ?? 0,
    };

    const nextId = await this.electrolysesService.getNextPublishedCompoundId(compound.id);
    const nextUrl = nextId === null
      ? `${this.host}catalog`
      : `${this.host}feed/${nextId}`;

    return {
      item,
      nextUrl,
      placeholderImageUrl: this.minIOSrc + PLACEHOLDER_IMAGE_KEY,
      placeholderVideoUrl: this.minIOSrc + PLACEHOLDER_VIDEO_KEY,
    };
  }

  @Get('add')
  @Render('electrolysesAddItem')
  async getAddPage() {
    const draft = await this.electrolysesService.getDraftByCreator(CURRENT_USER_ID);

    if (!draft) {
      return {
        draft: null,
        placeholderImageUrl: this.minIOSrc + PLACEHOLDER_IMAGE_KEY,
        placeholderVideoUrl: this.minIOSrc + PLACEHOLDER_VIDEO_KEY,
      };
    }

    return {
      draft: {
        ...draft,
        imgSrc: this.minIOSrc + (draft.imgSrc || PLACEHOLDER_IMAGE_KEY),
        vidSrc: this.minIOSrc + (draft.vidSrc || PLACEHOLDER_VIDEO_KEY),
        likes: draft.likes?.length ?? 0,
      },
      placeholderImageUrl: this.minIOSrc + PLACEHOLDER_IMAGE_KEY,
      placeholderVideoUrl: this.minIOSrc + PLACEHOLDER_VIDEO_KEY,
    };
  }

  @Get('catalog')
  @Render('electrolysesCatalog')
  async getCatalog(
    @Query('minAnodeCathodeMassRatio') minRaw?: string,
    @Query('maxAnodeCathodeMassRatio') maxRaw?: string,
  ) {
    let min: number | null = null;
    let max: number | null = null;
    let error: string | null = null;

    try {
      min = this.parseNumber(minRaw);
      max = this.parseNumber(maxRaw);

      // Ползунки одного слайдера можно поменять местами — тогда меняем местами и границы
      if (min !== null && max !== null && min > max) {
        [min, max] = [max, min];
      }
    } catch {
      error = 'Введите корректное неотрицательное соотношение массы анода к массе катода.';
    }

    const compounds = error
      ? []
      : await this.electrolysesService.getPublishedCompounds(min, max);

    const items = compounds.map((compound) => ({
      ...compound,
      imgSrc: this.minIOSrc + (compound.imgSrc || PLACEHOLDER_IMAGE_KEY),
      likes: compound.likes?.length ?? 0,
    }));

    return {
      items,
      placeholderImageUrl: this.minIOSrc + PLACEHOLDER_IMAGE_KEY,
      filters: {
        minAnodeCathodeMassRatio: min ?? 0,
        maxAnodeCathodeMassRatio: max ?? this.anodeCathodeMassRatioSliderMax,
        anodeCathodeMassRatioSliderMax: this.anodeCathodeMassRatioSliderMax,
        anodeCathodeMassRatioScale: [0, 0.25, 0.5, 0.75, 1].map(
          (part) => part * this.anodeCathodeMassRatioSliderMax,
        ),
      },
      error,
    };
  }

  @Post('draft')
  @Redirect('/electrolyses/add', 302)
  async addDraft(
    @Body('name') name: string,
  ): Promise<void> {
    await this.electrolysesService.addDraft(CURRENT_USER_ID, {
      name,
      imgSrc: PLACEHOLDER_IMAGE_KEY,
      vidSrc: PLACEHOLDER_VIDEO_KEY,
    });
  }

  @Post('publish')
  @Redirect('/electrolyses/catalog', 302)
  async publishDraft(
    @Body('shortDescription') shortDescription: string,
    @Body('anodeCathodeMassRatio') anodeCathodeMassRatioRaw: string,
    @Body('concentration') concentrationRaw: string,
  ): Promise<void> {
    if (anodeCathodeMassRatioRaw === undefined || anodeCathodeMassRatioRaw.trim() === '') {
      throw new BadRequestException('Укажите соотношение массы анода к массе катода.');
    }
    if (concentrationRaw === undefined || concentrationRaw.trim() === '') {
      throw new BadRequestException('Укажите концентрацию.');
    }

    await this.electrolysesService.publishDraft(CURRENT_USER_ID, {
      shortDescription,
      anodeCathodeMassRatio: Number(anodeCathodeMassRatioRaw),
      concentration: Number(concentrationRaw),
    });
  }

  @Post('delete')
  @Redirect('/electrolyses/catalog', 302)
  async deleteCompound(@Body('compoundId') compoundIdRaw: string): Promise<void> {
    const id = Number(compoundIdRaw);
    if (!Number.isSafeInteger(id) || id < 0) {
      throw new BadRequestException('Некорректный ID раствора.');
    }
    await this.electrolysesService.deleteCompound(id);
  }

  private parseNumber(raw?: string): number | null {
    if (raw === undefined || raw === null || raw.trim() === '') return null;

    const number = Number(raw);
    return Number.isFinite(number) && number >= 0 ? number : null;
  }
}
