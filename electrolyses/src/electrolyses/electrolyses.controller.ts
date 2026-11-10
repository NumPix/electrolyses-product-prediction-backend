import { Controller, Get, Param, Query, Render } from '@nestjs/common';

@Controller('electrolyses')
export class ElectrolysesController {
    private readonly compounds: {
        id: number;
        formula: string;
        name: string;
        anodeCathodeMassRatio?: number;
        concentration?: number;
        imgSrc: string;
        vidSrc: string;
        status: string;
    }[] = [
            {
                id: 0,
                formula: 'K₂SO₄',
                name: 'Сульфат калия',
                anodeCathodeMassRatio: 7.94, // m(O₂) / m(H₂)
                concentration: 70,
                imgSrc: 'k2so4.jpg',
                vidSrc: 'k2so4.mp4',
                status: 'Опубликован',
            },
            {
                id: 1,
                formula: 'NaHCO₃',
                name: 'Гидрокарбонат натрия',
                anodeCathodeMassRatio: 7.94, // m(O₂) / m(H₂)
                concentration: 45,
                imgSrc: 'nahco3.jpg',
                vidSrc: 'nahco3.mp4',
                status: 'Опубликован',
            },
            {
                id: 2,
                formula: '[Cu(NH₃)₄]Cl₂',
                name: 'Хлорид тетраамминмеди(II)',
                anodeCathodeMassRatio: 1.12, // m(Cl₂) / m(Cu)
                concentration: 40,
                imgSrc: 'cunh34cl2.jpg',
                vidSrc: 'cunh34cl2.mp4',
                status: 'Опубликован',
            },
            {
                id: 3,
                formula: 'CuSO₄',
                name: 'Сульфат меди(II)',
                imgSrc: 'cuso4.jpg',
                vidSrc: 'cuso4.mp4',
                status: 'Черновик',
            },
            {
                id: 4,
                formula: 'NaCl',
                name: 'Хлорид натрия',
                imgSrc: 'nacl.jpg',
                vidSrc: 'nacl.mp4',
                status: 'Удален',
            },
        ];

    private readonly compoundLikes = [
        // K₂SO₄
        { compoundId: 0, userId: 1837 },
        { compoundId: 0, userId: 2941 },
        { compoundId: 0, userId: 5728 },
        { compoundId: 0, userId: 8164 },
        { compoundId: 0, userId: 9235 },

        // NaHCO₃
        { compoundId: 1, userId: 1742 },
        { compoundId: 1, userId: 3951 },
        { compoundId: 1, userId: 6284 },
        { compoundId: 1, userId: 7419 },
        { compoundId: 1, userId: 9536 },

        // [Cu(NH₃)₄]Cl₂
        { compoundId: 2, userId: 1048 },
        { compoundId: 2, userId: 2159 },
        { compoundId: 2, userId: 3270 },
        { compoundId: 2, userId: 9169 },
        { compoundId: 2, userId: 1270 },
        { compoundId: 2, userId: 2381 },
    ];

    private readonly minIOSrc = 'http://localhost:9000/media/';
    private readonly host = 'http://localhost:3000/electrolyses/';

    private readonly anodeCathodeMassRatioSliderMax = 40;

    @Get('feed/:id')
    @Render('electrolysesFeed')
    getCompoundById(@Param('id') id: string) {
        const publishedCompounds = this.compounds.filter((compound) => compound.status === 'Опубликован');

        if (publishedCompounds.length === 0) return null;

        const parsedId = Number.parseInt(id, 10);

        const foundIndex = publishedCompounds.findIndex(
            (compound) => compound.id === parsedId,
        );

        const index = foundIndex === -1 ? 0 : foundIndex;
        const compound = publishedCompounds[index];

        const item = {
            ...compound,
            imgSrc: this.minIOSrc + compound.imgSrc,
            vidSrc: this.minIOSrc + compound.vidSrc,
            likes: this.compoundLikes.filter(
                (like) => like.compoundId === compound.id,
            ).length,
        };

        const nextIndex = (index + 1) % publishedCompounds.length;
        const nextUrl = `${this.host}feed/${publishedCompounds[nextIndex].id}`;

        return { item, nextUrl };
    }


    @Get('add')
    @Render('electrolysesAddItem')
    getAddPage() {
        const draft = this.compounds.find(
            (compound) => compound.status == 'Черновик',
        );

        return { draft };
    }

    @Get('catalog')
    @Render('electrolysesCatalog')
    getCardsPage(
        @Query('minAnodeCathodeMassRatio') minRaw?: string,
        @Query('maxAnodeCathodeMassRatio') maxRaw?: string,
    ) {
        let min = this.parseNumber(minRaw);
        let max = this.parseNumber(maxRaw);

        if (min !== null && max !== null && min > max) {
            [min, max] = [max, min];
        }

        const hasFilter = min !== null || max !== null;

        const items = this.compounds
            .filter((compound) => compound.status === 'Опубликован')
            .filter((compound) => {
                if (!hasFilter) return true;

                if (compound.anodeCathodeMassRatio === undefined || compound.anodeCathodeMassRatio === null) return false;

                if (min !== null && compound.anodeCathodeMassRatio < min) return false;
                if (max !== null && compound.anodeCathodeMassRatio > max) return false;

                return true;
            })
            .map((compound) => ({
                ...compound,
                imgSrc: this.minIOSrc + compound.imgSrc,
                likes: this.compoundLikes.filter(
                    (like) => like.compoundId === compound.id,
                ).length,
            }));

        return {
            items,
            filters: {
                minAnodeCathodeMassRatio: min ?? 0,
                maxAnodeCathodeMassRatio: max ?? this.anodeCathodeMassRatioSliderMax,
                anodeCathodeMassRatioSliderMax: this.anodeCathodeMassRatioSliderMax,
                anodeCathodeMassRatioScale: [0, 0.25, 0.5, 0.75, 1].map(
                    (part) => part * this.anodeCathodeMassRatioSliderMax,
                ),
            },
        };
    }

    private parseNumber(raw?: string): number | null {
        if (raw === undefined || raw === null || raw.trim() === '') return null;

        const n = Number(raw);
        return Number.isFinite(n) ? n : null;
    }
}