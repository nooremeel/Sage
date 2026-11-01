import { Module } from '@nestjs/common';
import { ProgressService } from './progress.service.js';
import { ProgressController } from './progress.controller.js';
import { DbModule } from '../../db/db.module.js';
import { CaslModule } from '../../common/casl/casl.module.js';

@Module({
  imports: [DbModule, CaslModule],
  controllers: [ProgressController],
  providers: [ProgressService],
  exports: [ProgressService],
})
export class ProgressModule {}
