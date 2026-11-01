import { Module } from '@nestjs/common';
import { QAService } from './qa.service.js';
import { QAController } from './qa.controller.js';
import { DbModule } from '../../db/db.module.js';
import { CaslModule } from '../../common/casl/casl.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';

@Module({
  imports: [DbModule, CaslModule, NotificationsModule],
  controllers: [QAController],
  providers: [QAService],
  exports: [QAService],
})
export class QAModule {}

