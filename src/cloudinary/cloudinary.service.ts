// src/cloudinary/cloudinary.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async uploadFile(file: Express.Multer.File): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          { resource_type: 'auto', folder: 'documents_cabinet' },
          (error: UploadApiErrorResponse, result: UploadApiResponse) => {
            if (error) {
              this.logger.error(`Erreur upload Cloudinary: ${error.message}`);
              // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
              return reject(error);
            }
            resolve(result);
          },
        )
        .end(file.buffer);
    });
  }
}
