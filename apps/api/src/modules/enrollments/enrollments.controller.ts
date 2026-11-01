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
import { EnrollmentsService } from './enrollments.service.js';
import { CheckPolicies } from '../../common/casl/check-policies.decorator.js';
import {
  EnrollmentSubject,
  type CurrentUser,
} from '../../common/casl/casl-ability.factory.js';
import { User } from '../../common/decorators/current-user.decorator.js';
import type {
  FreeEnrollmentInput,
  CouponEnrollmentInput,
  CreateCouponInput,
} from '@sage/shared';

@ApiTags('enrollments')
@Controller('enrollments')
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Post('free')
  @HttpCode(HttpStatus.CREATED)
  @CheckPolicies((ability) => ability.can('create', EnrollmentSubject))
  @ApiOperation({ summary: 'Enroll into a free course' })
  @ApiResponse({ status: 201, description: 'Enrolled successfully' })
  async enrollFree(
    @User() user: CurrentUser,
    @Body() body: FreeEnrollmentInput,
  ) {
    const enrollment = await this.enrollmentsService.enrollFree(
      user.id,
      body.courseId,
    );
    return { enrollment };
  }

  @Post('coupon')
  @HttpCode(HttpStatus.CREATED)
  @CheckPolicies((ability) => ability.can('create', EnrollmentSubject))
  @ApiOperation({ summary: 'Enroll using a coupon code' })
  @ApiResponse({ status: 201, description: 'Enrolled successfully with coupon' })
  async enrollCoupon(
    @User() user: CurrentUser,
    @Body() body: CouponEnrollmentInput,
  ) {
    const enrollment = await this.enrollmentsService.enrollWithCoupon(
      user.id,
      body.courseId,
      body.code,
    );
    return { enrollment };
  }

  @Get('mine')
  @CheckPolicies((ability) => ability.can('read', EnrollmentSubject))
  @ApiOperation({ summary: 'Get current user enrolled courses' })
  async getMyEnrollments(@User() user: CurrentUser) {
    const items = await this.enrollmentsService.getUserEnrollments(user.id);
    return { items };
  }

  @Get('check/:courseId')
  @CheckPolicies((ability) => ability.can('read', EnrollmentSubject))
  @ApiOperation({ summary: 'Check if current user is enrolled in course' })
  async checkEnrollment(
    @User() user: CurrentUser,
    @Param('courseId') courseId: string,
  ) {
    const isEnrolled = await this.enrollmentsService.isEnrolled(
      user.id,
      courseId,
    );
    return { enrolled: isEnrolled };
  }

  @Post('coupons')
  @HttpCode(HttpStatus.CREATED)
  @CheckPolicies((ability) => ability.can('manage', 'all'))
  @ApiOperation({ summary: 'Create a new coupon (admin only)' })
  async createCoupon(@Body() body: CreateCouponInput) {
    const coupon = await this.enrollmentsService.createCoupon(body);
    return { coupon };
  }
}
