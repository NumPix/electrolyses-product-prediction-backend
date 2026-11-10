import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { CreateElectrolyteSolutionDto } from './dto/create-electrolyte-solution.dto';
import { ElectrolyteSolutionFeedQueryDto } from './dto/electrolyte-solution-feed-query.dto';
import { ElectrolyteSolutionFiltersDto } from './dto/electrolyte-solution-filters.dto';
import type { ElectrolyteSolutionMediaFiles } from './dto/electrolyte-solution-media-files';
import {
  ElectrolyteSolutionCardDto,
  ElectrolyteSolutionDto,
  ElectrolyteSolutionFeedDto,
  ElectrolyteSolutionLikesDto,
} from './dto/electrolyte-solution-response.dto';
import { LikeElectrolyteSolutionDto } from './dto/like-electrolyte-solution.dto';
import { PublishElectrolyteSolutionDto } from './dto/publish-electrolyte-solution.dto';
import { MAX_VIDEO_SIZE } from './electrolyte-solution-media';
import { ElectrolysesService } from './electrolyses.service';

@Controller('electrolyses')
export class ElectrolysesController {
  constructor(private readonly electrolysesService: ElectrolysesService) {}

  @Get()
  getElectrolyses(
    @Query() filters: ElectrolyteSolutionFiltersDto,
  ): Promise<ElectrolyteSolutionCardDto[]> {
    return this.electrolysesService.getPublishedElectrolyses(filters);
  }

  @Get('feed')
  getElectrolyteSolutionFeed(
    @Query() query: ElectrolyteSolutionFeedQueryDto,
  ): Promise<ElectrolyteSolutionFeedDto> {
    return this.electrolysesService.getElectrolyteSolutionFeed(undefined, query.next === true);
  }

  @Get('feed/:id')
  getElectrolyteSolutionFeedById(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: ElectrolyteSolutionFeedQueryDto,
  ): Promise<ElectrolyteSolutionFeedDto> {
    return this.electrolysesService.getElectrolyteSolutionFeed(id, query.next === true);
  }

  @Get('draft')
  getDraft(): Promise<ElectrolyteSolutionDto> {
    return this.electrolysesService.getDraft();
  }

  @Post('draft')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'image', maxCount: 1 },
        { name: 'video', maxCount: 1 },
      ],
      { limits: { fileSize: MAX_VIDEO_SIZE } },
    ),
  )
  createDraft(
    @Body() dto: CreateElectrolyteSolutionDto,
    @UploadedFiles() files: ElectrolyteSolutionMediaFiles,
  ): Promise<ElectrolyteSolutionDto> {
    return this.electrolysesService.createDraft(dto, files);
  }

  @Put('draft')
  publishDraft(@Body() dto: PublishElectrolyteSolutionDto): Promise<ElectrolyteSolutionDto> {
    return this.electrolysesService.publishDraft(dto);
  }

  @Delete(':id')
  @HttpCode(204)
  deleteElectrolyteSolution(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.electrolysesService.deleteElectrolyteSolution(id);
  }

  @Post(':id/like')
  @HttpCode(200)
  likeElectrolyteSolution(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: LikeElectrolyteSolutionDto,
  ): Promise<ElectrolyteSolutionLikesDto> {
    return this.electrolysesService.likeElectrolyteSolution(id, dto);
  }
}
