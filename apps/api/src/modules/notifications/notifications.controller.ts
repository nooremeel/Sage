import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service.js';
import { CheckPolicies } from '../../common/casl/check-policies.decorator.js';
import {
  NotificationSubject,
  type CurrentUser,
} from '../../common/casl/casl-ability.factory.js';
import { User } from '../../common/decorators/current-user.decorator.js';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @CheckPolicies((ability) => ability.can('manage', NotificationSubject))
  @ApiOperation({ summary: 'Get current user notifications' })
  async getNotifications(
    @User() user: CurrentUser,
    @Query('limit') limit?: string,
  ) {
    const items = await this.notificationsService.getUserNotifications(
      user.id,
      limit ? parseInt(limit, 10) : 20,
    );
    return { items };
  }

  @Get('unread-count')
  @CheckPolicies((ability) => ability.can('manage', NotificationSubject))
  @ApiOperation({ summary: 'Get unread notification count' })
  async getUnreadCount(@User() user: CurrentUser) {
    const count = await this.notificationsService.getUnreadCount(user.id);
    return { count };
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  @CheckPolicies((ability) => ability.can('manage', NotificationSubject))
  @ApiOperation({ summary: 'Mark a notification as read' })
  async markAsRead(
    @User() user: CurrentUser,
    @Param('id') id: string,
  ) {
    await this.notificationsService.markAsRead(user.id, id);
  }

  @Patch('read-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  @CheckPolicies((ability) => ability.can('manage', NotificationSubject))
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllAsRead(@User() user: CurrentUser) {
    await this.notificationsService.markAllAsRead(user.id);
  }
}

