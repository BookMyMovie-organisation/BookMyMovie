import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function configureSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('BookMyMovie API')
    .setDescription(
      'API REST de collecte, traitement et consultation de données de films (source : TMDB).',
    )
    .setVersion('1.0.0')
    .addTag('Health', 'État du service')
    .addTag('Movies', 'Gestion des films')
    .addTag('Bookings', 'Gestion des réservations')
    .addTag('Analytics', 'Résultats Gold et analyses')
    .addTag('Pipeline', 'Collecte et traitement des données (administrateur)')
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('docs', app, documentFactory, {
    jsonDocumentUrl: 'docs/openapi.json',
    customSiteTitle: 'BookMyMovie API - Documentation',
  });
}
