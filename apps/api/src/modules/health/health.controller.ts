import { Controller, Get, Res, HttpStatus, Inject } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService } from './health.service.js';
import { Public } from '../../common/decorators/public.decorator.js';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(@Inject(HealthService) private readonly healthService: HealthService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Platform health check (Database, Redis, Storage)' })
  @ApiResponse({ status: 200, description: 'All systems operational or degraded' })
  @ApiResponse({ status: 503, description: 'All core systems down' })
  async check(@Res() res: Response): Promise<void> {
    const report = await this.healthService.getHealth();
    const httpStatus = report.status === 'error' ? HttpStatus.SERVICE_UNAVAILABLE : HttpStatus.OK;
    res.status(httpStatus).json(report);
  }
}
