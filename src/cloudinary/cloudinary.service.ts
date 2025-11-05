/* eslint-disable @typescript-eslint/prefer-promise-reject-errors */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
// cloudinary.service.ts
import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  constructor(private readonly configService: ConfigService) {
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

  // MÉTHODE MISE À JOUR pour accepter Uint8Array ou Buffer
  async uploadBuffer(
    buffer: Buffer | Uint8Array,
    filename: string,
    folder: string = 'exports',
  ): Promise<UploadApiResponse> {
    // S'assurer que nous avons un Buffer
    const fileBuffer = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'auto',
          folder,
          public_id: filename.split('.')[0], // Utiliser le nom sans extension comme public_id
          format: filename.split('.').pop(), // Conserver l'extension originale
        },
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

      uploadStream.end(fileBuffer);
    });
  }
  // Ajouter cette méthode à la classe CloudinaryService
  async deleteFile(publicId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      void cloudinary.uploader.destroy(
        publicId,
        { resource_type: 'auto' },
        (error, result) => {
          if (error) {
            this.logger.error(
              `❌ Erreur suppression Cloudinary: ${error.message}`,
            );
            return reject(error);
          }
          resolve(result);
        },
      );
    });
  }
}
