"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var ProblemDetailsFilter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProblemDetailsFilter = void 0;
const common_1 = require("@nestjs/common");
const TITLES = {
    400: 'Requête invalide',
    401: 'Non authentifié',
    403: 'Accès refusé',
    404: 'Ressource introuvable',
    409: "Conflit avec l'état actuel",
    429: 'Trop de requêtes',
    500: 'Erreur inattendue du serveur',
};
let ProblemDetailsFilter = ProblemDetailsFilter_1 = class ProblemDetailsFilter {
    logger = new common_1.Logger(ProblemDetailsFilter_1.name);
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        const status = exception instanceof common_1.HttpException
            ? exception.getStatus()
            : common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        let detail = 'Une erreur inattendue est survenue.';
        let errors;
        if (exception instanceof common_1.HttpException) {
            const body = exception.getResponse();
            if (typeof body === 'string') {
                detail = body;
            }
            else {
                const message = body.message;
                if (Array.isArray(message)) {
                    detail = 'Les données envoyées sont invalides.';
                    errors = message;
                }
                else if (message) {
                    detail = message;
                }
            }
        }
        else {
            const error = exception;
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
};
exports.ProblemDetailsFilter = ProblemDetailsFilter;
exports.ProblemDetailsFilter = ProblemDetailsFilter = ProblemDetailsFilter_1 = __decorate([
    (0, common_1.Catch)()
], ProblemDetailsFilter);
//# sourceMappingURL=problem-details.filter.js.map