import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Erreur de base de données';

    switch (exception.code) {
      case 'P2002':
        status = HttpStatus.CONFLICT;
        message =
          'Conflit de données: une ressource avec ces valeurs existe déjà';
        break;
      case 'P2025':
        status = HttpStatus.NOT_FOUND;
        message = 'Ressource non trouvée';
        break;
      case 'P2003':
        status = HttpStatus.BAD_REQUEST;
        message = 'Contrainte de clé étrangère violée';
        break;
      default:
        message = `Erreur de base de données: ${exception.message}`;
    }

    this.logger.error(
      `${request.method} ${request.url} - Status: ${status} - Prisma Error: ${exception.code}`,
      exception.stack,
    );

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: [message],
      details: {
        code: exception.code,
        target: exception.meta?.target,
      },
    });
  }
}
