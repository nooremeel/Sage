import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import type { Response } from 'express';

export interface SSEMessage {
  id: string;
  channel: string;
  event: string;
  data: any;
  timestamp: number;
}

@Injectable()
export class RealtimeService implements OnModuleDestroy {
  private readonly logger = new Logger(RealtimeService.name);

  // channel -> Set of active Express responses
  private readonly channels = new Map<string, Set<{ id: string; res: Response }>>();
  // Client ID -> Heartbeat timer
  private readonly heartbeats = new Map<string, NodeJS.Timeout>();

  // In-memory ring buffer for Last-Event-ID missed event recovery (stores last 500 events)
  private readonly eventBuffer: SSEMessage[] = [];
  private eventCounter = 1;

  onModuleDestroy() {
    for (const timer of this.heartbeats.values()) {
      clearInterval(timer);
    }
    this.heartbeats.clear();
    this.channels.clear();
  }

  registerClient(
    clientId: string,
    channelsList: string[],
    res: Response,
    lastEventId?: string,
  ) {
    // 1. Send initial connected event
    const initPayload = JSON.stringify({
      status: 'connected',
      clientId,
      subscribed: channelsList,
      time: new Date().toISOString(),
    });
    res.write(`event: connected\ndata: ${initPayload}\n\n`);

    // 2. Replay missed events if client reconnected with Last-Event-ID
    if (lastEventId) {
      const missed = this.getMissedEvents(lastEventId, channelsList);
      for (const msg of missed) {
        res.write(
          `id: ${msg.id}\nevent: ${msg.event}\ndata: ${JSON.stringify(msg.data)}\n\n`,
        );
      }
    }

    // 3. Register client on each channel
    for (const ch of channelsList) {
      if (!this.channels.has(ch)) {
        this.channels.set(ch, new Set());
      }
      this.channels.get(ch)!.add({ id: clientId, res });
    }

    // 4. Start 25s keep-alive heartbeat ping
    const timer = setInterval(() => {
      try {
        res.write(`: ping\n\n`);
      } catch {
        this.removeClient(clientId);
      }
    }, 25000);

    this.heartbeats.set(clientId, timer);

    this.logger.debug(
      `SSE client ${clientId} registered for channels: ${channelsList.join(', ')}`,
    );
  }

  removeClient(clientId: string) {
    const timer = this.heartbeats.get(clientId);
    if (timer) {
      clearInterval(timer);
      this.heartbeats.delete(clientId);
    }

    for (const [ch, set] of this.channels.entries()) {
      for (const entry of set) {
        if (entry.id === clientId) {
          set.delete(entry);
        }
      }
      if (set.size === 0) {
        this.channels.delete(ch);
      }
    }
  }

  broadcast(channel: string, event: string, data: any): SSEMessage {
    const eventId = String(this.eventCounter++);
    const message: SSEMessage = {
      id: eventId,
      channel,
      event,
      data,
      timestamp: Date.now(),
    };

    // Store in ring buffer (max 500)
    this.eventBuffer.push(message);
    if (this.eventBuffer.length > 500) {
      this.eventBuffer.shift();
    }

    const payload = `id: ${eventId}\nevent: ${event}\ndata: ${JSON.stringify(data)}\n\n`;

    const subscribers = this.channels.get(channel);
    if (subscribers) {
      for (const client of subscribers) {
        try {
          client.res.write(payload);
        } catch (err) {
          this.logger.warn(`Failed writing to SSE client ${client.id}: ${err}`);
        }
      }
    }

    return message;
  }

  publishToLesson(lessonId: string, event: string, data: any): SSEMessage {
    return this.broadcast(`lesson:${lessonId}`, event, data);
  }

  publishToUser(userId: string, event: string, data: any): SSEMessage {
    return this.broadcast(`user:${userId}`, event, data);
  }

  getMissedEvents(lastEventId: string, channelsList: string[]): SSEMessage[] {
    const lastIdNum = parseInt(lastEventId, 10);
    if (isNaN(lastIdNum)) return [];

    return this.eventBuffer.filter(
      (m) =>
        parseInt(m.id, 10) > lastIdNum && channelsList.includes(m.channel),
    );
  }
}

