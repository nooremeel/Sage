import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AdminService } from './admin.service.js';
import { CheckPolicies } from '../../common/casl/check-policies.decorator.js';
import { UserSubject, type CurrentUser } from '../../common/casl/casl-ability.factory.js';
import { User } from '../../common/decorators/current-user.decorator.js';
import type { ReviewCourseInput, ApplyInstructorInput } from '@sage/shared';

@ApiTags('admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('courses/review-queue')
  @CheckPolicies((ability) => ability.can('manage', 'all'))
  @ApiOperation({ summary: 'Admin list courses awaiting review' })
  async getReviewQueue() {
    const queue = await this.adminService.getReviewQueue();
    return { courses: queue };
  }

  @Post('courses/:id/review')
  @HttpCode(HttpStatus.OK)
  @CheckPolicies((ability) => ability.can('manage', 'all'))
  @ApiOperation({ summary: 'Admin approve or reject course review' })
  async reviewCourse(
    @Param('id') id: string,
    @Body() body: ReviewCourseInput,
  ) {
    return this.adminService.reviewCourse(id, body);
  }

  @Get('instructor-applications')
  @CheckPolicies((ability) => ability.can('manage', 'all'))
  @ApiOperation({ summary: 'Admin list pending instructor applications' })
  async getInstructorApplications() {
    const applications = await this.adminService.getInstructorApplications();
    return { applications };
  }

  @Post('instructor-applications/:id/decision')
  @HttpCode(HttpStatus.OK)
  @CheckPolicies((ability) => ability.can('manage', 'all'))
  @ApiOperation({ summary: 'Admin approve or reject instructor application' })
  async reviewApplication(
    @Param('id') id: string,
    @Body() body: { action: 'approve' | 'reject'; reason?: string },
  ) {
    return this.adminService.reviewInstructorApplication(id, body.action, body.reason);
  }

  @Post('instructor-applications/apply')
  @HttpCode(HttpStatus.CREATED)
  @CheckPolicies((ability) => ability.can('read', UserSubject))
  @ApiOperation({ summary: 'Student submit application to become instructor' })
  async applyInstructor(
    @User() user: CurrentUser,
    @Body() body: ApplyInstructorInput,
  ) {
    return this.adminService.applyToBecomeInstructor(user.id, body.bio);
  }
}

