"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.configureSwagger = configureSwagger;
const swagger_1 = require("@nestjs/swagger");
function configureSwagger(app) {
    const config = new swagger_1.DocumentBuilder()
        .setTitle('BookMyMovie API')
        .setDescription('API REST de collecte, traitement et consultation de données de films (source : TMDB).')
        .setVersion('1.0.0')
        .addTag('Health', 'État du service')
        .addTag('Movies', 'Gestion des films')
        .addTag('Bookings', 'Gestion des réservations')
        .addTag('Analytics', 'Résultats Gold et analyses')
        .addTag('Pipeline', 'Collecte et traitement des données (administrateur)')
        .build();
    const documentFactory = () => swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('docs', app, documentFactory, {
        jsonDocumentUrl: 'docs/openapi.json',
        customSiteTitle: 'BookMyMovie API - Documentation',
    });
}
//# sourceMappingURL=configure-swagger.js.map