import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

const TITLES: Record<number, string> = {
  400: 'Requête invalide',
  401: 'Non authentifié',
  403: 'Accès refusé',
  404: 'Ressource introuvable',
  409: "Conflit avec l'état actuel",
  429: 'Trop de requêtes',
  500: 'Erreur inattendue du serveur',
};

@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  private readonly logger = new Logger(ProblemDetailsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let detail = 'Une erreur inattendue est survenue.';
    let errors: string[] | undefined;

    if (exception instanceof HttpException) {
      const body = exception.getResponse();

      if (typeof body === 'string') {
        detail = body;
      } else {
        const message = (body as { message?: string | string[] }).message;

        if (Array.isArray(message)) {
          detail = 'Les données envoyées sont invalides.';
          errors = message;
        } else if (message) {
          detail = message;
        }
      }
    } else {
      const error = exception as Error;
      this.logger.error(error.message, error.stack);
    }

    response
      .status(status)
      .type('application/problem+json')
      .json({
        type: 'about:blank',
        title: TITLES[status] ?? 'Erreur',
        status,
        detail,
        instance: request.path,
        ...(errors && { errors }),
      });
  }
}