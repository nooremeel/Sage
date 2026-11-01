import { Module } from '@nestjs/common';
import { ReviewsService } from './reviews.service.js';
import { ReviewsController } from './reviews.controller.js';
import { DbModule } from '../../db/db.module.js';
import { CaslModule } from '../../common/casl/casl.module.js';
import { CacheModule } from '../../common/cache/cache.module.js';

@Module({
  imports: [DbModule, CaslModule, CacheModule],
  controllers: [ReviewsController],
  providers: [ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}

