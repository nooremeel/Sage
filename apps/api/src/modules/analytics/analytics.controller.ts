import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service.js';
import { CheckPolicies } from '../../common/casl/check-policies.decorator.js';
import {
  CourseSubject,
  type CurrentUser,
} from '../../common/casl/casl-ability.factory.js';
import { User } from '../../common/decorators/current-user.decorator.js';

@ApiTags('analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('instructor')
  @CheckPolicies((ability) => ability.can('manage', CourseSubject))
  @ApiOperation({ summary: 'Get aggregated analytics for instructor courses' })
  async getInstructorAnalytics(@User() user: CurrentUser) {
    const analytics = await this.analyticsService.getInstructorAnalytics(user.id);
    return { analytics };
  }

  @Get('admin')
  @CheckPolicies((ability) => ability.can('manage', 'all'))
  @ApiOperation({ summary: 'Get platform-wide aggregate metrics (admin only)' })
  async getAdminAnalytics() {
    const analytics = await this.analyticsService.getAdminAnalytics();
    return { analytics };
  }
}

