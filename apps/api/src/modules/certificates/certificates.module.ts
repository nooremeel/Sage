import { Module } from '@nestjs/common';
import { CertificatesService } from './certificates.service.js';
import { CertificatesController } from './certificates.controller.js';
import { DbModule } from '../../db/db.module.js';
import { CaslModule } from '../../common/casl/casl.module.js';
import { ProgressModule } from '../progress/progress.module.js';

@Module({
  imports: [DbModule, CaslModule, ProgressModule],
  controllers: [CertificatesController],
  providers: [CertificatesService],
  exports: [CertificatesService],
})
export class CertificatesModule {}
