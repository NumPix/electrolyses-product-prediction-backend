# Репозиторий backend по курсу "Разработка интернет-приложений"

Ветка `REST_API` — лабораторная работа 3: веб-сервис (REST API) для SPA. Код проекта находится в папке `electrolyses`.

Стек: NestJS, TypeORM, PostgreSQL, Silo(MinIO).

## Запуск

1. Запустить PostgreSQL (`docker compose up -d` в папке `electrolyses`) и Silo(MinIO).
2. В папке `electrolyses` создать файл `.env` по образцу `.env.example`: параметры PostgreSQL (`DB_*`) — те же, что `POSTGRES_*` в `env/database.env`, параметры MinIO (`MINIO_*`) — те, что заданы при установке MinIO.
3. Установить зависимости: `npm install`.
4. Создать таблицы и заполнить их тестовыми данными: `npm run migrate`, затем `npm run seed`.
5. Запустить веб-сервис: `npm run start:dev`. Адрес: `http://localhost:3000/api`.

Коллекция запросов для Postman/Insomnia: `electrolyses/postman/electrolyses-api.postman_collection.json`.

## Общие правила

- Адрес каждого метода начинается с `/api`.
- До авторизации (лабораторная 4) текущий пользователь зафиксирован константой: функция-singleton `getCurrentUser()` из `src/users/current-user.ts` возвращает пользователя с `id = 1`. Он создатель новых растворов и автор лайков.
- Статусы раствора: `draft` (черновик), `published` (опубликован), `deleted` (удалён). У создателя два метода смены статуса: публикация (`draft` → `published`) и удаление (`draft`/`published` → `deleted`). Вернуть раствор в черновик нельзя, удалённый раствор изменить нельзя.
- Системные поля (`id`, `status`, `creatorId`, `createdAt`, `formedAt`) вычисляются на бэкенде. Передавать их с клиента запрещено: запрос с полями, которых нет в описании метода, отклоняется с кодом 400.
- Растворы в статусе `deleted` клиенту не передаются.
- Изображения и видео хранятся в Silo(MinIO) (бакет из `MINIO_BUCKET`, по умолчанию `media`), в БД записываются только имена файлов. В ответах API вместо имён отдаются ссылки на файлы. Если имя файла в БД пустое, отдаётся файл по умолчанию: `default-compound.jpg` или `default-compound.mp4`.
- Ошибки возвращаются в формате NestJS:

```json
{ "message": "Раствор с id 7 не найден", "error": "Not Found", "statusCode": 404 }
```

## HTTP методы

### Домен растворов электролитов (услуги): `/api/electrolyses`

| Метод | URL | Назначение |
|---|---|---|
| GET | `/api/electrolyses` | Список опубликованных растворов с фильтрацией |
| GET | `/api/electrolyses/feed`<br>`/api/electrolyses/feed/:id?next=true` | Лента: один опубликованный раствор |
| GET | `/api/electrolyses/draft` | Черновик текущего пользователя |
| POST | `/api/electrolyses/draft` | Создание черновика с изображением и видео |
| PUT | `/api/electrolyses/draft` | Публикация черновика текущего пользователя |
| DELETE | `/api/electrolyses/:id` | Удаление своего раствора (soft delete) |
| POST | `/api/electrolyses/:id/like` | Лайк от текущего пользователя |

#### GET `/api/electrolyses`

Список опубликованных растворов, упорядоченный по `id`.

Параметры запроса (необязательные):

| Параметр | Тип | Описание |
|---|---|---|
| `minAnodeCathodeMassRatio` | число ≥ 0 | Соотношение массы анода к массе катода, от |
| `maxAnodeCathodeMassRatio` | число ≥ 0 | Соотношение массы анода к массе катода, до |

Если `min` больше `max`, границы меняются местами (ползунки слайдера поменялись местами).

Пример: `GET /api/electrolyses?minAnodeCathodeMassRatio=5&maxAnodeCathodeMassRatio=10`

Ответ `200`:

```json
[
  {
    "id": 0,
    "compoundName": "Сульфат калия",
    "imageUrl": "http://localhost:9000/media/k2so4.jpg",
    "anodeCathodeMassRatio": 7.94,
    "concentrationPercent": 70,
    "likes": 5,
    "createdByCurrentUser": 1
  },
  {
    "id": 1,
    "compoundName": "Гидрокарбонат натрия",
    "imageUrl": "http://localhost:9000/media/nahco3.jpg",
    "anodeCathodeMassRatio": 7.94,
    "concentrationPercent": 45,
    "likes": 5,
    "createdByCurrentUser": 0
  }
]
```

`createdByCurrentUser` — `1`, если раствор создал текущий пользователь, иначе `0`.

Ошибки: `400` — параметр не число или меньше 0.

#### GET `/api/electrolyses/feed`, `/api/electrolyses/feed/:id`

| Запрос | Результат |
|---|---|
| `/feed` | Первый опубликованный раствор |
| `/feed/:id` | Опубликованный раствор с этим `id` |
| `/feed/:id?next=true` | Следующий опубликованный раствор после `id`; после последнего — снова первый |

Из БД читается только одна строка раствора.

Ответ `200`:

```json
{
  "id": 1,
  "compoundName": "Гидрокарбонат натрия",
  "shortDescription": "Раствор гидрокарбоната натрия.",
  "imageUrl": "http://localhost:9000/media/nahco3.jpg",
  "videoUrl": "http://localhost:9000/media/nahco3.mp4",
  "anodeCathodeMassRatio": 7.94,
  "concentrationPercent": 45,
  "likes": 5,
  "likedByCurrentUser": 0
}
```

`likedByCurrentUser` — `1`, если текущий пользователь лайкнул раствор, иначе `0`.

Ошибки: `400` — `id` не целое число или `next` не `true`/`false`; `404` — опубликованный раствор не найден.

#### GET `/api/electrolyses/draft`

Черновик текущего пользователя, `id` не указывается (у пользователя не больше одного черновика).

Ответ `200`:

```json
{
  "id": 5,
  "compoundName": "Сульфат натрия",
  "shortDescription": null,
  "status": "draft",
  "imageUrl": "http://localhost:9000/media/electrolyte-solution-image-6b8f2c1e-5d4a-4f3b-9a7e-1c2d3e4f5a6b.jpg",
  "videoUrl": "http://localhost:9000/media/electrolyte-solution-video-0e9d8c7b-6a5f-4e3d-8c2b-1a0f9e8d7c6b.mp4",
  "anodeCathodeMassRatio": null,
  "concentrationPercent": null,
  "createdAt": "2026-11-12T09:30:00.000Z",
  "formedAt": null
}
```

Ошибки: `404` — черновика нет.

#### POST `/api/electrolyses/draft`

Создаёт черновик текущего пользователя (кнопка «Далее» на странице добавления). Тело запроса — `multipart/form-data`:

| Поле | Тип | Описание |
|---|---|---|
| `compoundName` | текст | Название раствора, до 120 символов |
| `image` | файл | Изображение: jpg, png, webp или gif, до 5 МБ |
| `video` | файл | Короткое видео: mp4, webm или mov, до 50 МБ |

Файлы сохраняются в MinIO под сгенерированными латинскими именами `electrolyte-solution-image-<uuid>.<расширение>` и `electrolyte-solution-video-<uuid>.<расширение>`. Эти имена записываются в поля `image_key` и `video_key`. Если раствор не удалось сохранить в БД, загруженные файлы удаляются из MinIO.

Ответ `201` — созданный черновик (поля как в `GET /api/electrolyses/draft`).

Ошибки: `400` — нет названия или файла, неверный тип файла, изображение больше 5 МБ, переданы лишние поля; `409` — у пользователя уже есть черновик; `413` — файл больше 50 МБ; `503` — MinIO недоступен.

#### PUT `/api/electrolyses/draft`

Публикация черновика текущего пользователя (кнопка «Опубликовать»), `id` не указывается: статус `draft` → `published`, дата формирования `formedAt` ставится на бэкенде. Тело запроса — JSON:

```json
{
  "shortDescription": "Раствор сульфата натрия. При электролизе на катоде выделяется водород, на аноде — кислород.",
  "anodeCathodeMassRatio": 7.94,
  "concentrationPercent": 10
}
```

| Поле | Тип | Описание |
|---|---|---|
| `shortDescription` | строка | Краткое описание, не пустое |
| `anodeCathodeMassRatio` | число ≥ 0 | Соотношение массы анода к массе катода |
| `concentrationPercent` | число от 0 до 100 | Концентрация, % |

Ответ `200` — опубликованный раствор (поля как в `GET /api/electrolyses/draft`, `status: "published"`, заполнен `formedAt`).

Ошибки: `400` — поле не заполнено или передано лишнее поле; `404` — у пользователя нет черновика.

#### DELETE `/api/electrolyses/:id`

Логическое удаление (soft delete): статус меняется на `deleted`, строка остаётся в БД. Удалять можно только свои растворы (черновик или опубликованный).

Ответ `204` без тела.

Ошибки: `403` — раствор другого пользователя; `404` — раствор не найден или уже удалён.

#### POST `/api/electrolyses/:id/like`

Лайк от текущего пользователя опубликованному раствору. Тело запроса — JSON: `{ "like": 1 }` ставит лайк, `{ "like": 0 }` отменяет. Повторный лайк не создаёт вторую строку.

Ответ `200`:

```json
{ "id": 1, "likes": 6, "likedByCurrentUser": 1 }
```

Ошибки: `400` — `like` не 0 и не 1; `404` — опубликованный раствор не найден.

### Домен пользователей: `/api/users`

| Метод | URL | Назначение |
|---|---|---|
| POST | `/api/users/registration` | Регистрация |
| POST | `/api/users/authentication` | Аутентификация (заглушка до лабораторной 4) |
| POST | `/api/users/deauthorization` | Деавторизация (заглушка до лабораторной 4) |

#### POST `/api/users/registration`

Тело запроса — JSON:

```json
{ "displayName": "Новый пользователь", "password": "secret123" }
```

| Поле | Тип | Описание |
|---|---|---|
| `displayName` | строка | Имя пользователя, до 100 символов, уникальное |
| `password` | строка | Пароль, от 6 до 128 символов |

Ответ `201` (пароль не возвращается):

```json
{ "id": 9537, "displayName": "Новый пользователь" }
```

Ошибки: `400` — поле не заполнено или неверной длины; `409` — имя уже занято.

#### POST `/api/users/authentication`, `/api/users/deauthorization`

Заглушки до лабораторной 4: тело запроса не нужно. Ответ `200`:

```json
{ "message": "Заглушка: аутентификация появится в лабораторной работе 4" }
```

## Таблицы базы данных

Каскадное удаление запрещено: у всех внешних ключей `ON DELETE RESTRICT`.

### `electrolyses_users` — пользователи

| Поле | Тип | NULL | Описание |
|---|---|---|---|
| `id` | integer, PK | нет | Идентификатор пользователя |
| `display_name` | varchar(100) | нет | Имя пользователя |
| `password` | varchar(128) | нет | Пароль, по умолчанию `password` |

### `electrolyte_solutions` — растворы электролитов (услуги)

| Поле | Тип | NULL | Описание |
|---|---|---|---|
| `id` | integer, PK | нет | Идентификатор раствора |
| `compound_name` | varchar(120) | нет | Название |
| `short_description` | text | да | Краткое описание (заполняется при публикации) |
| `status` | varchar(20) | нет | `draft` / `published` / `deleted`, по умолчанию `draft` |
| `image_key` | varchar(255) | нет | Имя файла изображения в MinIO |
| `video_key` | varchar(255) | нет | Имя файла видео в MinIO |
| `anode_cathode_mass_ratio` | double precision | да | Соотношение массы анода к массе катода (заполняется при публикации) |
| `concentration_percent` | double precision | да | Концентрация, % (заполняется при публикации) |
| `created_at` | timestamp | нет | Дата создания |
| `formed_at` | timestamp | да | Дата формирования (публикации) |
| `creator_id` | integer, FK → `electrolyses_users.id` | нет | Создатель |

Частичный уникальный индекс `uq_electrolyte_solutions_one_draft_per_creator` по `creator_id` для строк со статусом `draft`: у пользователя не больше одного черновика.

### `electrolyte_solution_likes` — лайки (м-м пользователи и растворы)

| Поле | Тип | NULL | Описание |
|---|---|---|---|
| `id` | integer, PK | нет | Идентификатор лайка |
| `compound_id` | integer, FK → `electrolyte_solutions.id` | нет | Раствор |
| `user_id` | integer, FK → `electrolyses_users.id` | нет | Пользователь |

Ограничение уникальности `uq_electrolyte_solution_likes_compound_user` по паре (`compound_id`, `user_id`): пользователь ставит раствору не больше одного лайка.

## Структура кода

| Путь (в `electrolyses/src`) | Назначение |
|---|---|
| `entities/` | Модели TypeORM для трёх таблиц |
| `electrolyses/` | Домен растворов: контроллер, сервис с бизнес-логикой, сериализатор, DTO |
| `users/` | Домен пользователей и функция-singleton текущего пользователя |
| `minio/minio.service.ts` | Загрузка файлов в Silo(MinIO) и ссылки на них |
| `main.ts` | Префикс `/api` и проверка входных данных (`ValidationPipe`) |
