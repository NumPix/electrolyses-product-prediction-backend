import { DataSource } from 'typeorm';
import { ElectrolyteSolution } from '../src/entities/electrolyte-solution.entity';
import { User } from '../src/entities/user.entity';
import { ElectrolyteSolutionLike } from '../src/entities/electrolyte-solution-like.entity';

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: [ElectrolyteSolution, User, ElectrolyteSolutionLike],
  synchronize: true,
});

async function run() {
  await dataSource.initialize();
  try {
    await dataSource.synchronize();

    await dataSource.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_electrolyte_solutions_one_draft_per_creator
      ON electrolyte_solutions (creator_id)
      WHERE status = 'draft'
    `);

    await dataSource.query(
      `INSERT INTO electrolyses_users (id, display_name)
       VALUES ($1, $2)
       ON CONFLICT (id) DO NOTHING`,
      [1, 'Лабораторный пользователь'],
    );

    await dataSource.query(`
      SELECT setval(
        pg_get_serial_sequence('electrolyses_users', 'id'),
        GREATEST((SELECT COALESCE(MAX(id), 1) FROM electrolyses_users), 1),
        true
      )
    `);

    console.log('Структура базы данных создана.');
  } finally {
    await dataSource.destroy();
  }
}

run().catch((error: unknown) => {
  console.error('Ошибка миграции:', error);
  process.exitCode = 1;
});
