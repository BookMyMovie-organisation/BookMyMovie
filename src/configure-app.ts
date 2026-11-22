import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';

export function configureApp(app: INestApplication): void {
  app.setGlobalPrefix('api');

  app.enableVersioning({
    type: VersioningType.URI,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      validationError: {
        target: false,
        value: false,
      },
    }),
  );
}