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
  ElectrolysisService,
  PLACEHOLDER_IMAGE_KEY,
  PLACEHOLDER_VIDEO_KEY,
} from './electrolysis.service';

const CURRENT_USER_ID = 1;

@Controller('electrolysis')
export class ElectrolysisController {
  private readonly minIOSrc = 'http://localhost:9000/media/';
  private readonly host = 'http://localhost:3000/electrolysis/';

  constructor(private readonly electrolysisService: ElectrolysisService) { }

  @Get(['feed', 'feed/:id'])
  @Render('feed')
  async getCompoundById(
    @Param('id') id?: string,
    @Query('next') next?: string,
  ) {
    let compoundId: number | null;

    if (id === undefined) {
      compoundId = await this.electrolysisService.getFirstPublishedCompoundId();
    } else {
      const parsedId = Number.parseInt(id, 10);
      if (!Number.isSafeInteger(parsedId) || parsedId < 0) {
        throw new BadRequestException('Некорректный ID раствора.');
      }
      compoundId = parsedId;
      if (next === 'true') {
        compoundId = await this.electrolysisService.getNextPublishedCompoundId(parsedId);
      }
    }

    if (compoundId === null) {
      throw new NotFoundException('Опубликованные растворы не найдены.');
    }

    const compound = await this.electrolysisService.getPublishedCompoundById(compoundId);
    if (!compound) {
      throw new NotFoundException('Опубликованный раствор не найден.');
    }

    const item = {
      ...compound,
      imgSrc: this.minIOSrc + (compound.imgSrc || PLACEHOLDER_IMAGE_KEY),
      vidSrc: this.minIOSrc + (compound.vidSrc || PLACEHOLDER_VIDEO_KEY),
      likes: compound.likes?.length ?? 0,
    };

    const nextId = await this.electrolysisService.getNextPublishedCompoundId(compound.id);
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
  @Render('add-item')
  async getAddPage() {
    const draft = await this.electrolysisService.getDraftByCreator(CURRENT_USER_ID);

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
  @Render('catalog')
  async getCatalog(
    @Query('minMass') minRaw?: string,
    @Query('maxMass') maxRaw?: string,
  ) {
    let min: number | null = null;
    let max: number | null = null;
    let error: string | null = null;

    try {
      min = this.parseNumber(minRaw);
      max = this.parseNumber(maxRaw);

      if (min !== null && max !== null && min > max) {
        error = 'Минимальная масса не может превышать максимальную.';
      }
    } catch {
      error = 'Введите корректную неотрицательную массу.';
    }

    const compounds = error
      ? []
      : await this.electrolysisService.getPublishedCompounds(max, min);

    const items = compounds.map((compound) => ({
      ...compound,
      imgSrc: this.minIOSrc + (compound.imgSrc || PLACEHOLDER_IMAGE_KEY),
      likes: compound.likes?.length ?? 0,
    }));

    return {
      items,
      placeholderImageUrl: this.minIOSrc + PLACEHOLDER_IMAGE_KEY,
      filters: {
        minMass: minRaw ?? '',
        maxMass: maxRaw ?? '',
      },
      error,
    };
  }

  @Post('draft')
  @Redirect('/electrolysis/add', 302)
  async addDraft(
    @Body('formula') formula: string,
    @Body('name') name: string,
  ): Promise<void> {
    await this.electrolysisService.addDraft(CURRENT_USER_ID, {
      formula,
      name,
      imgSrc: PLACEHOLDER_IMAGE_KEY,
      vidSrc: PLACEHOLDER_VIDEO_KEY,
    });
  }

  @Post('publish')
  @Redirect('/electrolysis/catalog', 302)
  async publishDraft(
    @Body('shortDescription') shortDescription: string,
    @Body('mass') massRaw: string,
    @Body('concentration') concentrationRaw: string,
  ): Promise<void> {
    if (massRaw === undefined || massRaw.trim() === '') {
      throw new BadRequestException('Укажите массу.');
    }
    if (concentrationRaw === undefined || concentrationRaw.trim() === '') {
      throw new BadRequestException('Укажите концентрацию.');
    }

    await this.electrolysisService.publishDraft(CURRENT_USER_ID, {
      shortDescription,
      mass: Number(massRaw),
      concentration: Number(concentrationRaw),
    });
  }

  @Post('delete')
  @Redirect('/electrolysis/catalog', 302)
  async deleteCompound(@Body('compoundId') compoundIdRaw: string): Promise<void> {
    const id = Number(compoundIdRaw);
    if (!Number.isSafeInteger(id) || id < 0) {
      throw new BadRequestException('Некорректный ID раствора.');
    }
    await this.electrolysisService.deleteCompound(id);
  }

  private parseNumber(raw?: string): number | null {
    if (raw === undefined || raw === null || raw.trim() === '') return null;

    const number = Number(raw);
    return Number.isFinite(number) && number >= 0 ? number : null;
  }
}
