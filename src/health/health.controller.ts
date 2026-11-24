import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: "Vérifier l'état du service" })
  @ApiOkResponse({ description: 'Le service est disponible.' })
  check() {
    return {
      status: 'ok',
      service: 'bookmymovie-api',
      timestamp: new Date().toISOString(),
    };
  }
}
