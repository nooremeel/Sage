import { Module } from '@nestjs/common';
import { CurriculumController } from './curriculum.controller.js';
import { CurriculumService } from './curriculum.service.js';
import { MediaModule } from '../media/media.module.js';

@Module({
  imports: [MediaModule],
  controllers: [CurriculumController],
  providers: [CurriculumService],
  exports: [CurriculumService],
})
export class CurriculumModule {}

