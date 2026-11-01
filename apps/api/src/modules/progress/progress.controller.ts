import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ProgressService } from './progress.service.js';
import { CheckPolicies } from '../../common/casl/check-policies.decorator.js';
import {
  ProgressSubject,
  type CurrentUser,
} from '../../common/casl/casl-ability.factory.js';
import { User } from '../../common/decorators/current-user.decorator.js';
import type { ProgressHeartbeatInput } from '@sage/shared';

@ApiTags('progress')
@Controller('progress')
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Post('heartbeat')
  @HttpCode(HttpStatus.OK)
  @CheckPolicies((ability) => ability.can('manage', ProgressSubject))
  @ApiOperation({ summary: 'Record lesson watch/read progress heartbeat' })
  @ApiResponse({ status: 200, description: 'Progress updated' })
  async recordHeartbeat(
    @User() user: CurrentUser,
    @Body() body: ProgressHeartbeatInput,
  ) {
    return this.progressService.recordHeartbeat(user.id, body);
  }

  @Get('courses/:courseId')
  @CheckPolicies((ability) => ability.can('manage', ProgressSubject))
  @ApiOperation({ summary: 'Get current user progress for a course' })
  async getCourseProgress(
    @User() user: CurrentUser,
    @Param('courseId') courseId: string,
  ) {
    const courseProgress = await this.progressService.getCourseProgress(
      user.id,
      courseId,
    );
    return { courseProgress };
  }

  @Get('continue-learning')
  @CheckPolicies((ability) => ability.can('manage', ProgressSubject))
  @ApiOperation({ summary: 'Get continue learning feed with next lessons' })
  async getContinueLearning(@User() user: CurrentUser) {
    const items = await this.progressService.getContinueLearning(user.id);
    return { items };
  }
}

