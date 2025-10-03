import { Module } from '@nestjs/common';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { PrismaService } from '../prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Module({
  controllers: [DocumentsController],
  providers: [DocumentsService, PrismaService, CloudinaryService],
})
export class DocumentsModule {}
