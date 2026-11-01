import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service.js';
import { CheckPolicies } from '../../common/casl/check-policies.decorator.js';
import { Public } from '../../common/decorators/public.decorator.js';
import {
  ReviewSubject,
  type CurrentUser,
} from '../../common/casl/casl-ability.factory.js';
import { User } from '../../common/decorators/current-user.decorator.js';
import type { CreateReviewInput } from '@sage/shared';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get('courses/:courseId')
  @Public()
  @ApiOperation({ summary: 'Get all reviews and rating aggregates for a course' })
  async getCourseReviews(@Param('courseId') courseId: string) {
    return this.reviewsService.getCourseReviews(courseId);
  }

  @Post('courses/:courseId')
  @HttpCode(HttpStatus.CREATED)
  @CheckPolicies((ability) => ability.can('manage', ReviewSubject))
  @ApiOperation({ summary: 'Submit or update a review for an enrolled course' })
  @ApiResponse({ status: 201, description: 'Review saved' })
  async submitReview(
    @User() user: CurrentUser,
    @Param('courseId') courseId: string,
    @Body() body: CreateReviewInput,
  ) {
    const review = await this.reviewsService.createOrUpdateReview(
      user.id,
      courseId,
      body,
    );
    return { review };
  }
}

