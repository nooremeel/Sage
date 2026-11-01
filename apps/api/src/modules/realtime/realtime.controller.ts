import {
  Controller,
  Get,
  Req,
  Res,
  Query,
  Headers,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { RealtimeService } from './realtime.service.js';
import { CheckPolicies } from '../../common/casl/check-policies.decorator.js';
import {
  RealtimeSubject,
  type CurrentUser,
} from '../../common/casl/casl-ability.factory.js';
import { User } from '../../common/decorators/current-user.decorator.js';

@ApiTags('realtime')
@Controller('realtime')
export class RealtimeController {
  constructor(private readonly realtimeService: RealtimeService) {}

  @Get('events')
  @CheckPolicies((ability) => ability.can('read', RealtimeSubject))
  @ApiOperation({ summary: 'Establish authenticated Server-Sent Events stream' })
  streamEvents(
    @User() user: CurrentUser,
    @Req() req: Request,
    @Res() res: Response,
    @Headers('last-event-id') lastEventId?: string,
    @Query('channel') channelQuery?: string,
  ) {
    // 1. Set headers for SSE streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    const clientId = `client_${user.id}_${uuidv4().slice(0, 8)}`;

    // Channels: user's personal channel plus any requested topic channels
    const channels = [`user:${user.id}`];
    if (channelQuery) {
      for (const ch of channelQuery.split(',')) {
        const trimmed = ch.trim();
        if (trimmed && !channels.includes(trimmed)) {
          channels.push(trimmed);
        }
      }
    }

    // 2. Register client with service
    this.realtimeService.registerClient(
      clientId,
      channels,
      res,
      lastEventId,
    );

    // 3. Cleanup on disconnect
    req.on('close', () => {
      this.realtimeService.removeClient(clientId);
    });
  }
}

