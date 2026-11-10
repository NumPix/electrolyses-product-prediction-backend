import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from 'minio';

@Injectable()
export class MinioService implements OnModuleInit {
  private readonly logger = new Logger(MinioService.name);
  private readonly client: Client;
  private readonly bucket: string;
  private readonly publicUrl: string;

  constructor(config: ConfigService) {
    const endPoint = config.get<string>('MINIO_ENDPOINT', 'localhost');
    const port = Number(config.get<string>('MINIO_PORT', '9000'));
    const useSSL = config.get<string>('MINIO_USE_SSL', 'false') === 'true';

    this.bucket = config.get<string>('MINIO_BUCKET', 'media');
    this.client = new Client({
      endPoint,
      port,
      useSSL,
      accessKey: config.get<string>('MINIO_ACCESS_KEY', 'minioadmin'),
      secretKey: config.get<string>('MINIO_SECRET_KEY', 'minioadmin'),
    });
    this.publicUrl = `${useSSL ? 'https' : 'http'}://${endPoint}:${port}/${this.bucket}/`;
  }

  async onModuleInit(): Promise<void> {
    try {
      if (await this.client.bucketExists(this.bucket)) {
        return;
      }

      await this.client.makeBucket(this.bucket);
      await this.client.setBucketPolicy(
        this.bucket,
        JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { AWS: ['*'] },
              Action: ['s3:GetObject'],
              Resource: [`arn:aws:s3:::${this.bucket}/*`],
            },
          ],
        }),
      );
      this.logger.log(`Создан бакет "${this.bucket}" с публичным чтением`);
    } catch (error) {
      this.logger.error(`Не удалось проверить бакет "${this.bucket}": ${String(error)}`);
    }
  }

  async upload(key: string, file: Buffer, contentType: string): Promise<void> {
    await this.client.putObject(this.bucket, key, file, file.length, {
      'Content-Type': contentType,
    });
  }

  async removeQuietly(key: string): Promise<void> {
    try {
      await this.client.removeObject(this.bucket, key);
    } catch (error) {
      this.logger.warn(`Не удалось удалить файл "${key}": ${String(error)}`);
    }
  }

  url(key: string): string {
    return this.publicUrl + encodeURIComponent(key);
  }
}
