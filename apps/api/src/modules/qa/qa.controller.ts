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
import { QAService } from './qa.service.js';
import { CheckPolicies } from '../../common/casl/check-policies.decorator.js';
import {
  QASubject,
  type CurrentUser,
} from '../../common/casl/casl-ability.factory.js';
import { User } from '../../common/decorators/current-user.decorator.js';
import type {
  CreateQAThreadInput,
  CreateQAMessageInput,
} from '@sage/shared';

@ApiTags('qa')
@Controller('qa')
export class QAController {
  constructor(private readonly qaService: QAService) {}

  @Get('lessons/:lessonId')
  @CheckPolicies((ability) => ability.can('read', QASubject))
  @ApiOperation({ summary: 'Get Q&A discussion threads for a lesson' })
  async getLessonThreads(
    @User() user: CurrentUser,
    @Param('lessonId') lessonId: string,
  ) {
    const threads = await this.qaService.getLessonThreads(user.id, lessonId);
    return { threads };
  }

  @Post('lessons/:lessonId/threads')
  @HttpCode(HttpStatus.CREATED)
  @CheckPolicies((ability) => ability.can('create', QASubject))
  @ApiOperation({ summary: 'Start a new Q&A discussion thread' })
  @ApiResponse({ status: 201, description: 'Thread created' })
  async createThread(
    @User() user: CurrentUser,
    @Param('lessonId') lessonId: string,
    @Body() body: CreateQAThreadInput,
  ) {
    const thread = await this.qaService.createThread(user.id, lessonId, body);
    return { thread };
  }

  @Get('threads/:threadId')
  @CheckPolicies((ability) => ability.can('read', QASubject))
  @ApiOperation({ summary: 'Get thread details and all reply messages' })
  async getThread(
    @User() user: CurrentUser,
    @Param('threadId') threadId: string,
  ) {
    return this.qaService.getThreadWithMessages(user.id, threadId);
  }

  @Post('threads/:threadId/messages')
  @HttpCode(HttpStatus.CREATED)
  @CheckPolicies((ability) => ability.can('create', QASubject))
  @ApiOperation({ summary: 'Post a reply message in a discussion thread' })
  @ApiResponse({ status: 201, description: 'Reply posted' })
  async postReply(
    @User() user: CurrentUser,
    @Param('threadId') threadId: string,
    @Body() body: CreateQAMessageInput,
  ) {
    const message = await this.qaService.postReply(user.id, threadId, body);
    return { message };
  }
}
