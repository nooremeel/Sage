import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConfigService } from '@nestjs/config';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';
import { CacheService } from '../../src/common/cache/cache.service.js';
import { EtagInterceptor } from '../../src/common/interceptors/etag.interceptor.js';

describe('Cache-Aside & Stampede Protection Suite', () => {
  let cacheService: CacheService;
  let mockStorage: Map<string, string>;
  let mockSets: Map<string, Set<string>>;

  beforeEach(() => {
    mockStorage = new Map();
    mockSets = new Map();

    const mockConfig = {
      get: vi.fn((key: string, defaultVal?: unknown) => {
        if (key === 'REDIS_PROVIDER') return 'mock';
        return defaultVal;
      }),
    } as unknown as ConfigService;

    cacheService = new CacheService(mockConfig);

    // Mock internal client for isolated testing
    (cacheService as unknown as { client: unknown; isAvailable: boolean }).client = {
      async get(k: string) {
        return mockStorage.get(k) ?? null;
      },
      async set(k: string, v: string) {
        mockStorage.set(k, v);
        return 'OK';
      },
      async setnx(k: string, v: string) {
        if (mockStorage.has(k)) return false;
        mockStorage.set(k, v);
        return true;
      },
      async del(k: string) {
        return mockStorage.delete(k) ? 1 : 0;
      },
      async sadd(k: string, ...members: string[]) {
        if (!mockSets.has(k)) mockSets.set(k, new Set());
        const s = mockSets.get(k)!;
        let added = 0;
        for (const m of members) {
          if (!s.has(m)) {
            s.add(m);
            added++;
          }
        }
        return added;
      },
      async smembers(k: string) {
        return Array.from(mockSets.get(k) || []);
      },
      async ping() {
        return 'PONG';
      },
    };
    (cacheService as unknown as { isAvailable: boolean }).isAvailable = true;
  });

  it('serves cached value on cache hit without invoking fetcher', async () => {
    mockStorage.set('catalog:test', JSON.stringify({ items: ['course-1'] }));

    const fetcher = vi.fn().mockResolvedValue({ items: ['fresh-course'] });
    const result = await cacheService.getOrSet('catalog:test', 300, fetcher);

    expect(result).toEqual({ items: ['course-1'] });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('invokes fetcher on cache miss and writes result to cache', async () => {
    const fetcher = vi.fn().mockResolvedValue({ items: ['new-course'] });
    const result = await cacheService.getOrSet('catalog:miss', 300, fetcher, 'catalog');

    expect(result).toEqual({ items: ['new-course'] });
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(mockStorage.has('catalog:miss')).toBe(true);
    expect(mockSets.get('tag:catalog')?.has('catalog:miss')).toBe(true);
  });

  it('invalidates all keys associated with a tag', async () => {
    mockStorage.set('course:1', JSON.stringify({ id: '1' }));
    mockStorage.set('course:2', JSON.stringify({ id: '2' }));

    if (!mockSets.has('tag:catalog')) mockSets.set('tag:catalog', new Set());
    mockSets.get('tag:catalog')!.add('course:1');
    mockSets.get('tag:catalog')!.add('course:2');

    await cacheService.invalidateTag('catalog');

    expect(mockStorage.has('course:1')).toBe(false);
    expect(mockStorage.has('course:2')).toBe(false);
  });

  it('protects against cache stampede by acquiring mutex lock on cache miss', async () => {
    let callCount = 0;
    const expensiveOperation = async () => {
      callCount++;
      await new Promise((resolve) => setTimeout(resolve, 80));
      return { data: 'computed_expensive_payload' };
    };

    // Simulate 3 concurrent requests hitting the same missing cache key
    const [res1, res2, res3] = await Promise.all([
      cacheService.getOrSet('stampede:key', 300, expensiveOperation),
      cacheService.getOrSet('stampede:key', 300, expensiveOperation),
      cacheService.getOrSet('stampede:key', 300, expensiveOperation),
    ]);

    expect(res1).toEqual({ data: 'computed_expensive_payload' });
    expect(res2).toEqual({ data: 'computed_expensive_payload' });
    expect(res3).toEqual({ data: 'computed_expensive_payload' });
    // Fetcher should have executed only once due to mutex stampede protection
    expect(callCount).toBe(1);
  });
});

describe('ETag & Cache-Control Interceptor', () => {
  it('attaches ETag and Cache-Control headers to GET responses', async () => {
    const interceptor = new EtagInterceptor();
    const headers: Record<string, string> = {};

    const mockResponse = {
      headersSent: false,
      setHeader: (name: string, value: string) => {
        headers[name.toLowerCase()] = value;
      },
      status: vi.fn(),
    };

    const mockRequest = {
      method: 'GET',
      headers: {},
    };

    const context = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
        getResponse: () => mockResponse,
      }),
    } as unknown as ExecutionContext;

    const handler = {
      handle: () => of({ courses: [{ id: '123', title: 'Next.js' }] }),
    } as CallHandler;

    const result = await new Promise((resolve) => {
      interceptor.intercept(context, handler).subscribe(resolve);
    });

    expect(result).toEqual({ courses: [{ id: '123', title: 'Next.js' }] });
    expect(headers['etag']).toBeDefined();
    expect(headers['cache-control']).toBe('public, s-maxage=300, stale-while-revalidate=60');
  });

  it('answers 304 Not Modified when If-None-Match header matches the ETag', async () => {
    const interceptor = new EtagInterceptor();
    let capturedStatus: number | null = null;
    let setEtag: string | null = null;

    const mockResponse = {
      headersSent: false,
      setHeader: (name: string, value: string) => {
        if (name.toLowerCase() === 'etag') setEtag = value;
      },
      status: (code: number) => {
        capturedStatus = code;
      },
    };

    const payload = { courses: [] };
    const serialized = JSON.stringify(payload);
    // Precalculate SHA-1 hash for comparison
    const { createHash } = await import('node:crypto');
    const expectedHash = createHash('sha1').update(serialized).digest('hex');

    const mockRequest = {
      method: 'GET',
      headers: {
        'if-none-match': `"${expectedHash}"`,
      },
    };

    const context = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
        getResponse: () => mockResponse,
      }),
    } as unknown as ExecutionContext;

    const handler = {
      handle: () => of(payload),
    } as CallHandler;

    const result = await new Promise((resolve) => {
      interceptor.intercept(context, handler).subscribe(resolve);
    });

    expect(capturedStatus).toBe(304);
    expect(result).toBeNull();
  });
});

