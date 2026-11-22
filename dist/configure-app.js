"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.configureApp = configureApp;
const common_1 = require("@nestjs/common");
const problem_details_filter_1 = require("./common/filters/problem-details.filter");
function configureApp(app) {
    app.setGlobalPrefix('api');
    app.enableVersioning({
        type: common_1.VersioningType.URI,
        defaultVersion: '1',
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        validationError: {
            target: false,
            value: false,
        },
    }));
    app.useGlobalFilters(new problem_details_filter_1.ProblemDetailsFilter());
}
//# sourceMappingURL=configure-app.js.map