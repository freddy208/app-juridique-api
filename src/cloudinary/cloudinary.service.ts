import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  constructor(private readonly configService: ConfigService) {
    // ✅ Configuration Cloudinary à partir du ConfigService
    cloudinary.config({
      cloud_name: 'duqsblvzm',
      api_key: '899467543445141',
      api_secret: 'syL85VzaVqteUdihzYcwXG14ODY',
    });
  }

  async uploadFile(file: Express.Multer.File): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { resource_type: 'auto', folder: 'documents_cabinet' },
        (error: UploadApiErrorResponse, result: UploadApiResponse) => {
          if (error) {
            this.logger.error(`❌ Erreur Cloudinary: ${error.message}`);
            return reject(
              new BadRequestException(
                'Erreur upload Cloudinary: ' + error.message,
              ),
            );
          }
          resolve(result);
        },
      );

      uploadStream.end(file.buffer);
    });
  }
}
