import { Module } from '@nestjs/common';
import { EnrollmentsService } from './enrollments.service.js';
import { EnrollmentsController } from './enrollments.controller.js';
import { DbModule } from '../../db/db.module.js';
import { CaslModule } from '../../common/casl/casl.module.js';

@Module({
  imports: [DbModule, CaslModule],
  controllers: [EnrollmentsController],
  providers: [EnrollmentsService],
  exports: [EnrollmentsService],
})
export class EnrollmentsModule {}
