import { Module } from '@nestjs/common';
import { QuizzesService } from './quizzes.service.js';
import { QuizzesController } from './quizzes.controller.js';
import { DbModule } from '../../db/db.module.js';
import { CaslModule } from '../../common/casl/casl.module.js';

@Module({
  imports: [DbModule, CaslModule],
  controllers: [QuizzesController],
  providers: [QuizzesService],
  exports: [QuizzesService],
})
export class QuizzesModule {}
