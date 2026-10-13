import { DataSource } from 'typeorm';
import { Compound } from '../src/electrolysis/entities/compound.entity';
import { ElectrolysisUser } from '../src/electrolysis/entities/electrolysis-user.entity';
import { CompoundLike } from '../src/electrolysis/entities/compound-like.entity';
import { PLACEHOLDER_IMAGE_KEY, PLACEHOLDER_VIDEO_KEY } from '../src/electrolysis/electrolysis.service';

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: [Compound, ElectrolysisUser, CompoundLike],
  synchronize: false,
});

const users = [
  { id: 1, displayName: 'Лабораторный пользователь' },
  ...[1837, 2941, 5728, 8164, 9235, 1742, 3951, 6284, 7419, 9536, 1048, 2159, 3270, 9169, 1270, 2381]
    .map((id) => ({ id, displayName: `Пользователь ${id}` })),
];

const compounds = [
  {
    id: 0,
    formula: 'K₂SO₄',
    name: 'Сульфат калия',
    description: 'Раствор сульфата калия.',
    status: 'published',
    imgSrc: 'k2so4.jpg',
    vidSrc: 'k2so4.mp4',
    mass: 250,
    concentration: 70,
    formedAt: new Date(),
    creatorId: 1,
  },
  {
    id: 1,
    formula: 'NaHCO₃',
    name: 'Гидрокарбонат натрия',
    description: 'Раствор гидрокарбоната натрия.',
    status: 'published',
    imgSrc: 'nahco3.jpg',
    vidSrc: 'nahco3.mp4',
    mass: 135,
    concentration: 45,
    formedAt: new Date(),
    creatorId: 1,
  },
  {
    id: 2,
    formula: '[Cu(NH₃)₄]Cl₂',
    name: 'Хлорид тетраамминмеди(II)',
    description: 'Раствор хлорида тетраамминмеди(II).',
    status: 'published',
    imgSrc: 'cunh34cl2.jpg',
    vidSrc: 'cunh34cl2.mp4',
    mass: 502,
    concentration: 40,
    formedAt: new Date(),
    creatorId: 1,
  },
  {
    id: 3,
    formula: 'CuSO₄',
    name: 'Сульфат меди(II)',
    description: '',
    status: 'draft',
    imgSrc: 'cuso4.jpg',
    vidSrc: PLACEHOLDER_VIDEO_KEY,
    mass: null,
    concentration: null,
    formedAt: null,
    creatorId: 1,
  },
  {
    id: 4,
    formula: 'NaCl',
    name: 'Хлорид натрия',
    description: 'Пример логически удалённой записи.',
    status: 'deleted',
    imgSrc: 'nacl.jpg',
    vidSrc: 'nacl.mp4',
    mass: null,
    concentration: null,
    formedAt: null,
    creatorId: 1,
  },
];

const likes: Array<[number, number]> = [
  [0, 1837], [0, 2941], [0, 5728], [0, 8164], [0, 9235],
  [1, 1742], [1, 3951], [1, 6284], [1, 7419], [1, 9536],
  [2, 1048], [2, 2159], [2, 3270], [2, 9169], [2, 1270], [2, 2381],
];

async function run() {
  await dataSource.initialize();
  try {
    await dataSource.transaction(async (manager) => {
      for (const user of users) {
        await manager.query(
          `INSERT INTO electrolysis_users (id, display_name)
           VALUES ($1, $2)
           ON CONFLICT (id) DO UPDATE SET display_name = EXCLUDED.display_name`,
          [user.id, user.displayName],
        );
      }

      for (const item of compounds) {
        await manager.query(
          `INSERT INTO electrolyte_solutions (
             id, formula, compound_name, short_description, status,
             image_key, video_key, mass_grams, concentration_percent,
             formed_at, creator_id
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
           ON CONFLICT (id) DO UPDATE SET
             formula = EXCLUDED.formula,
             compound_name = EXCLUDED.compound_name,
             short_description = EXCLUDED.short_description,
             status = EXCLUDED.status,
             image_key = EXCLUDED.image_key,
             video_key = EXCLUDED.video_key,
             mass_grams = EXCLUDED.mass_grams,
             concentration_percent = EXCLUDED.concentration_percent,
             formed_at = EXCLUDED.formed_at,
             creator_id = EXCLUDED.creator_id`,
          [
            item.id, item.formula, item.name, item.description, item.status,
            item.imgSrc, item.vidSrc, item.mass, item.concentration,
            item.formedAt, item.creatorId,
          ],
        );
      }

      for (const [compoundId, userId] of likes) {
        await manager.query(
          `INSERT INTO electrolyte_solution_likes (compound_id, user_id)
           VALUES ($1, $2)
           ON CONFLICT (compound_id, user_id) DO NOTHING`,
          [compoundId, userId],
        );
      }

      await manager.query(`
        SELECT setval(
          pg_get_serial_sequence('electrolysis_users', 'id'),
          GREATEST((SELECT COALESCE(MAX(id), 1) FROM electrolysis_users), 1), true
        )
      `);
      await manager.query(`
        SELECT setval(
          pg_get_serial_sequence('electrolyte_solutions', 'id'),
          GREATEST((SELECT COALESCE(MAX(id), 1) FROM electrolyte_solutions), 1), true
        )
      `);
    });

    console.log('Тестовые данные добавлены.');
  } finally {
    await dataSource.destroy();
  }
}

run().catch((error: unknown) => {
  console.error('Ошибка заполнения БД:', error);
  process.exitCode = 1;
});
