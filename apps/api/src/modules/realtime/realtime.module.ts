import { Module, Global } from '@nestjs/common';
import { RealtimeService } from './realtime.service.js';
import { RealtimeController } from './realtime.controller.js';
import { CaslModule } from '../../common/casl/casl.module.js';

@Global()
@Module({
  imports: [CaslModule],
  controllers: [RealtimeController],
  providers: [RealtimeService],
  exports: [RealtimeService],
})
export class RealtimeModule {}

