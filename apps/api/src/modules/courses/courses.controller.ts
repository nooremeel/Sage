import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CoursesService } from './courses.service.js';
import { Public } from '../../common/decorators/public.decorator.js';
import { CheckPolicies } from '../../common/casl/check-policies.decorator.js';
import { CourseSubject, type CurrentUser } from '../../common/casl/casl-ability.factory.js';
import { User } from '../../common/decorators/current-user.decorator.js';
import { EtagInterceptor } from '../../common/interceptors/etag.interceptor.js';
import type { CreateCourseInput, UpdateCourseInput, CourseLevel, Locale } from '@sage/shared';

@ApiTags('courses')
@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Public()
  @UseInterceptors(EtagInterceptor)
  @Get()
  @ApiOperation({ summary: 'Public catalog listing of published courses' })
  async getCatalog(
    @Query('categorySlug') categorySlug?: string,
    @Query('level') level?: CourseLevel,
    @Query('locale') locale?: Locale,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.coursesService.getCatalog({
      categorySlug,
      level,
      locale,
      limit: limit ? parseInt(limit, 10) : 20,
      offset: offset ? parseInt(offset, 10) : 0,
    });
  }

  @Public()
  @UseInterceptors(EtagInterceptor)
  @Get('search')
  @ApiOperation({ summary: 'Search published courses with Arabic normalization, filters, and keyset pagination' })
  async searchCourses(
    @Query('q') q?: string,
    @Query('categorySlug') categorySlug?: string,
    @Query('level') level?: CourseLevel,
    @Query('price') price?: 'free' | 'paid',
    @Query('locale') locale?: Locale,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.coursesService.searchCourses({
      q,
      categorySlug,
      level,
      price,
      locale: locale || 'en',
      cursor,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  @Public()
  @UseInterceptors(EtagInterceptor)
  @Get('detail/:slug')
  @ApiOperation({ summary: 'Public course details and curriculum outline by localized slug' })
  async getCourseBySlug(
    @Param('slug') slug: string,
    @Query('locale') locale?: Locale,
  ) {
    const course = await this.coursesService.getCourseBySlug(slug, locale || 'en');
    return { course };
  }

  @Get('studio/my-courses')
  @CheckPolicies((ability) => ability.can('create', CourseSubject))
  @ApiOperation({ summary: 'Instructor studio list of own courses' })
  async getMyCourses(@User() user: CurrentUser) {
    const items = await this.coursesService.getInstructorCourses(user.id);
    return { courses: items };
  }

  @Get('studio/:id')
  @CheckPolicies((ability) => ability.can('create', CourseSubject))
  @ApiOperation({ summary: 'Instructor studio get course details by ID' })
  async getStudioCourse(
    @Param('id') id: string,
    @User() user: CurrentUser,
  ) {
    const course = await this.coursesService.getStudioCourse(id, user.id, user.role === 'admin');
    return { course };
  }

  @Post('studio')
  @HttpCode(HttpStatus.CREATED)
  @CheckPolicies((ability) => ability.can('create', CourseSubject))
  @ApiOperation({ summary: 'Instructor create new course draft' })
  async createCourse(
    @User() user: CurrentUser,
    @Body() body: CreateCourseInput,
  ) {
    const course = await this.coursesService.createCourse(user.id, body);
    return { course };
  }

  @Patch('studio/:id')
  @CheckPolicies((ability) => ability.can('create', CourseSubject))
  @ApiOperation({ summary: 'Instructor update course details or translations' })
  async updateCourse(
    @Param('id') id: string,
    @User() user: CurrentUser,
    @Body() body: UpdateCourseInput,
  ) {
    const course = await this.coursesService.updateCourse(id, user.id, body, user.role === 'admin');
    return { course };
  }

  @Post('studio/:id/submit')
  @HttpCode(HttpStatus.OK)
  @CheckPolicies((ability) => ability.can('create', CourseSubject))
  @ApiOperation({ summary: 'Submit course draft for admin review' })
  async submitForReview(
    @Param('id') id: string,
    @User() user: CurrentUser,
  ) {
    const course = await this.coursesService.submitForReview(id, user.id, user.role === 'admin');
    return { course };
  }

  @Delete('studio/:id')
  @HttpCode(HttpStatus.OK)
  @CheckPolicies((ability) => ability.can('create', CourseSubject))
  @ApiOperation({ summary: 'Soft delete a course draft' })
  async deleteCourse(
    @Param('id') id: string,
    @User() user: CurrentUser,
  ) {
    await this.coursesService.deleteCourse(id, user.id, user.role === 'admin');
    return { ok: true };
  }
}

