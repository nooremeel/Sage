import {
  Controller,
  Get,
  Post,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CertificatesService } from './certificates.service.js';
import { CheckPolicies } from '../../common/casl/check-policies.decorator.js';
import { Public } from '../../common/decorators/public.decorator.js';
import {
  CertificateSubject,
  type CurrentUser,
} from '../../common/casl/casl-ability.factory.js';
import { User } from '../../common/decorators/current-user.decorator.js';

@ApiTags('certificates')
@Controller('certificates')
export class CertificatesController {
  constructor(private readonly certificatesService: CertificatesService) {}

  @Post('claim/:courseId')
  @HttpCode(HttpStatus.CREATED)
  @CheckPolicies((ability) => ability.can('manage', CertificateSubject))
  @ApiOperation({ summary: 'Claim verifiable completion certificate for 100% completed course' })
  @ApiResponse({ status: 201, description: 'Certificate claimed' })
  async claimCertificate(
    @User() user: CurrentUser,
    @Param('courseId') courseId: string,
  ) {
    const certificate = await this.certificatesService.claimCertificate(
      user.id,
      courseId,
    );
    return { certificate };
  }

  @Get('verify/:serial')
  @Public()
  @ApiOperation({ summary: 'Publicly verify certificate validity and details via serial or QR' })
  async verifyCertificate(@Param('serial') serial: string) {
    const verification = await this.certificatesService.verifyCertificate(serial);
    return { verification };
  }

  @Get('mine')
  @CheckPolicies((ability) => ability.can('manage', CertificateSubject))
  @ApiOperation({ summary: 'Get all certificates claimed by current student' })
  async getMyCertificates(@User() user: CurrentUser) {
    const items = await this.certificatesService.getUserCertificates(user.id);
    return { items };
  }
}

