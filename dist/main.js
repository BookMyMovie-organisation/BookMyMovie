"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const configure_app_1 = require("./configure-app");
const configure_swagger_1 = require("./configure-swagger");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    (0, configure_app_1.configureApp)(app);
    (0, configure_swagger_1.configureSwagger)(app);
    await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
//# sourceMappingURL=main.js.map