import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CurriculumService } from './curriculum.service.js';
import { MediaService } from '../media/media.service.js';
import { CheckPolicies } from '../../common/casl/check-policies.decorator.js';
import { CourseSubject, type CurrentUser } from '../../common/casl/casl-ability.factory.js';
import { User } from '../../common/decorators/current-user.decorator.js';
import type {
  CreateSectionInput,
  UpdateSectionInput,
  ReorderSectionsInput,
  CreateLessonInput,
  UpdateLessonInput,
  ReorderLessonsInput,
} from '@sage/shared';

@ApiTags('curriculum')
@Controller('curriculum')
export class CurriculumController {
  constructor(
    private readonly curriculumService: CurriculumService,
    private readonly mediaService: MediaService,
  ) {}

  // Sections
  @Post('courses/:courseId/sections')
  @HttpCode(HttpStatus.CREATED)
  @CheckPolicies((ability) => ability.can('create', CourseSubject))
  @ApiOperation({ summary: 'Add a new section to a course' })
  async addSection(
    @Param('courseId') courseId: string,
    @User() user: CurrentUser,
    @Body() body: CreateSectionInput,
  ) {
    const section = await this.curriculumService.addSection(courseId, user.id, body, user.role === 'admin');
    return { section };
  }

  @Patch('sections/:id')
  @CheckPolicies((ability) => ability.can('create', CourseSubject))
  @ApiOperation({ summary: 'Update section title' })
  async updateSection(
    @Param('id') id: string,
    @User() user: CurrentUser,
    @Body() body: UpdateSectionInput,
  ) {
    const section = await this.curriculumService.updateSection(id, user.id, body, user.role === 'admin');
    return { section };
  }

  @Delete('sections/:id')
  @HttpCode(HttpStatus.OK)
  @CheckPolicies((ability) => ability.can('create', CourseSubject))
  @ApiOperation({ summary: 'Delete a section and its lessons' })
  async deleteSection(
    @Param('id') id: string,
    @User() user: CurrentUser,
  ) {
    await this.curriculumService.deleteSection(id, user.id, user.role === 'admin');
    return { ok: true };
  }

  @Post('courses/:courseId/sections/reorder')
  @HttpCode(HttpStatus.OK)
  @CheckPolicies((ability) => ability.can('create', CourseSubject))
  @ApiOperation({ summary: 'Transactionally reorder sections in a course' })
  async reorderSections(
    @Param('courseId') courseId: string,
    @User() user: CurrentUser,
    @Body() body: ReorderSectionsInput,
  ) {
    await this.curriculumService.reorderSections(courseId, user.id, body.sectionIds, user.role === 'admin');
    return { ok: true };
  }

  // Lessons
  @Post('sections/:sectionId/lessons')
  @HttpCode(HttpStatus.CREATED)
  @CheckPolicies((ability) => ability.can('create', CourseSubject))
  @ApiOperation({ summary: 'Add a new lesson to a section' })
  async addLesson(
    @Param('sectionId') sectionId: string,
    @User() user: CurrentUser,
    @Body() body: CreateLessonInput,
  ) {
    const lesson = await this.curriculumService.addLesson(sectionId, user.id, body, user.role === 'admin');
    return { lesson };
  }

  @Patch('lessons/:id')
  @CheckPolicies((ability) => ability.can('create', CourseSubject))
  @ApiOperation({ summary: 'Update lesson details or preview status' })
  async updateLesson(
    @Param('id') id: string,
    @User() user: CurrentUser,
    @Body() body: UpdateLessonInput,
  ) {
    const lesson = await this.curriculumService.updateLesson(id, user.id, body, user.role === 'admin');
    return { lesson };
  }

  @Delete('lessons/:id')
  @HttpCode(HttpStatus.OK)
  @CheckPolicies((ability) => ability.can('create', CourseSubject))
  @ApiOperation({ summary: 'Delete a lesson' })
  async deleteLesson(
    @Param('id') id: string,
    @User() user: CurrentUser,
  ) {
    await this.curriculumService.deleteLesson(id, user.id, user.role === 'admin');
    return { ok: true };
  }

  @Post('sections/:sectionId/lessons/reorder')
  @HttpCode(HttpStatus.OK)
  @CheckPolicies((ability) => ability.can('create', CourseSubject))
  @ApiOperation({ summary: 'Transactionally reorder lessons in a section' })
  async reorderLessons(
    @Param('sectionId') sectionId: string,
    @User() user: CurrentUser,
    @Body() body: ReorderLessonsInput,
  ) {
    await this.curriculumService.reorderLessons(sectionId, user.id, body.lessonIds, user.role === 'admin');
    return { ok: true };
  }

  @Get('lessons/:id/playback')
  @CheckPolicies((ability) => ability.can('read', CourseSubject))
  @ApiOperation({ summary: 'Obtain a signed 4-hour playback token for video streaming' })
  async getPlaybackToken(
    @Param('id') id: string,
    @User() user: CurrentUser,
  ) {
    return this.mediaService.getPlaybackToken(id, user.id, user.role);
  }
}


