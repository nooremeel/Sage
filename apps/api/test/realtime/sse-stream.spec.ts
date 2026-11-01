import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { RealtimeService } from '../../src/modules/realtime/realtime.service.js';

describe('Real-Time SSE Streaming Suite', () => {
  let realtimeService: RealtimeService;

  beforeEach(() => {
    realtimeService = new RealtimeService();
  });

  afterEach(() => {
    realtimeService.onModuleDestroy();
  });

  it('registers an SSE client and emits the initial connection event', () => {
    const writes: string[] = [];
    const mockRes: any = {
      write: vi.fn((chunk: string) => {
        writes.push(chunk);
      }),
    };

    realtimeService.registerClient('client_1', ['user:user_1', 'lesson:lesson_1'], mockRes);

    expect(mockRes.write).toHaveBeenCalled();
    expect(writes[0]).toContain('event: connected');
    expect(writes[0]).toContain('client_1');
  });

  it('broadcasts event to subscribed channel only', () => {
    const writesClient1: string[] = [];
    const writesClient2: string[] = [];

    const mockRes1: any = {
      write: vi.fn((chunk: string) => writesClient1.push(chunk)),
    };
    const mockRes2: any = {
      write: vi.fn((chunk: string) => writesClient2.push(chunk)),
    };

    realtimeService.registerClient('c1', ['lesson:lesson_1'], mockRes1);
    realtimeService.registerClient('c2', ['lesson:lesson_2'], mockRes2);

    realtimeService.publishToLesson('lesson_1', 'new_qa_message', {
      text: 'Hello from lesson 1',
    });

    // Client 1 should receive message
    const received1 = writesClient1.find((w) => w.includes('new_qa_message'));
    expect(received1).toBeDefined();
    expect(received1).toContain('Hello from lesson 1');

    // Client 2 should NOT receive message
    const received2 = writesClient2.find((w) => w.includes('new_qa_message'));
    expect(received2).toBeUndefined();
  });

  it('replays missed events when client reconnects with Last-Event-ID', () => {
    // 1. Broadcast two messages to channel before client connects
    realtimeService.broadcast('lesson:lesson_10', 'm1', { seq: 1 });
    const msg2 = realtimeService.broadcast('lesson:lesson_10', 'm2', { seq: 2 });
    const msg3 = realtimeService.broadcast('lesson:lesson_10', 'm3', { seq: 3 });

    // 2. Client connects with Last-Event-ID pointing to msg2
    const writes: string[] = [];
    const mockRes: any = {
      write: vi.fn((chunk: string) => writes.push(chunk)),
    };

    realtimeService.registerClient('c3', ['lesson:lesson_10'], mockRes, msg2.id);

    // Should replay msg3 (since id > msg2.id)
    const replayed = writes.filter((w) => w.includes('event: m3'));
    expect(replayed).toHaveLength(1);
    expect(replayed[0]).toContain(`id: ${msg3.id}`);

    // Should NOT replay msg1 or msg2
    expect(writes.some((w) => w.includes('event: m1'))).toBe(false);
  });
});
