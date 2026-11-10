export interface UploadedMediaFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export interface ElectrolyteSolutionMediaFiles {
  image?: UploadedMediaFile[];
  video?: UploadedMediaFile[];
}
