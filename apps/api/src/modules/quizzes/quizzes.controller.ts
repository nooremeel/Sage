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
import { QuizzesService } from './quizzes.service.js';
import { CheckPolicies } from '../../common/casl/check-policies.decorator.js';
import {
  QuizSubject,
  type CurrentUser,
} from '../../common/casl/casl-ability.factory.js';
import { User } from '../../common/decorators/current-user.decorator.js';
import type {
  CreateQuizInput,
  SubmitQuizAttemptInput,
} from '@sage/shared';

@ApiTags('quizzes')
@Controller('quizzes')
export class QuizzesController {
  constructor(private readonly quizzesService: QuizzesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @CheckPolicies((ability) => ability.can('create', QuizSubject))
  @ApiOperation({ summary: 'Create or update a quiz for a lesson' })
  async createQuiz(
    @User() user: CurrentUser,
    @Body() body: CreateQuizInput,
  ) {
    const result = await this.quizzesService.createQuiz(
      user.id,
      body,
      user.role === 'admin',
    );
    return result;
  }

  @Get(':id')
  @CheckPolicies((ability) => ability.can('read', QuizSubject))
  @ApiOperation({ summary: 'Get quiz questions for student (no answers leaked)' })
  async getQuiz(
    @User() user: CurrentUser,
    @Param('id') id: string,
  ) {
    const quiz = await this.quizzesService.getQuizForStudent(user.id, id);
    return { quiz };
  }

  @Get('by-lesson/:lessonId')
  @CheckPolicies((ability) => ability.can('read', QuizSubject))
  @ApiOperation({ summary: 'Get quiz by lesson ID' })
  async getQuizByLesson(
    @User() user: CurrentUser,
    @Param('lessonId') lessonId: string,
  ) {
    const quiz = await this.quizzesService.getQuizByLessonId(user.id, lessonId);
    return { quiz };
  }

  @Post(':id/attempts')
  @HttpCode(HttpStatus.CREATED)
  @CheckPolicies((ability) => ability.can('create', QuizSubject))
  @ApiOperation({ summary: 'Submit quiz answers for server-side grading' })
  @ApiResponse({ status: 201, description: 'Attempt evaluated' })
  async submitAttempt(
    @User() user: CurrentUser,
    @Param('id') id: string,
    @Body() body: SubmitQuizAttemptInput,
  ) {
    const result = await this.quizzesService.submitQuizAttempt(
      user.id,
      id,
      body,
    );
    return { result };
  }

  @Get(':id/attempts')
  @CheckPolicies((ability) => ability.can('read', QuizSubject))
  @ApiOperation({ summary: 'Get past attempts for a quiz' })
  async getAttempts(
    @User() user: CurrentUser,
    @Param('id') id: string,
  ) {
    const attempts = await this.quizzesService.getAttempts(user.id, id);
    return { attempts };
  }
}

