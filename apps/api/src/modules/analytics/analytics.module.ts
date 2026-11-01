import { Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service.js';
import { AnalyticsController } from './analytics.controller.js';
import { DbModule } from '../../db/db.module.js';
import { CaslModule } from '../../common/casl/casl.module.js';

@Module({
  imports: [DbModule, CaslModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}

