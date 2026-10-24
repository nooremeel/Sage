import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HealthService } from './health.service.js';
import { ConfigService } from '@nestjs/config';

describe('HealthService', () => {
  let healthService: HealthService;
  let mockSql: any;
  let mockConfig: Partial<ConfigService>;

  beforeEach(() => {
    mockSql = vi.fn().mockResolvedValue([{ '?column?': 1 }]);
    mockConfig = {
      get: vi.fn((_key: string, defaultValue?: any) => defaultValue),
    };
    healthService = new HealthService(mockSql as any, mockConfig as ConfigService);
  });

  it('reports database as up when query succeeds', async () => {
    const dbHealth = await healthService.checkDatabase();
    expect(dbHealth.status).toBe('up');
    expect(typeof dbHealth.latencyMs).toBe('number');
  });

  it('reports database as down when query fails', async () => {
    mockSql = vi.fn().mockRejectedValue(new Error('Connection refused'));
    healthService = new HealthService(mockSql as any, mockConfig as ConfigService);

    const dbHealth = await healthService.checkDatabase();
    expect(dbHealth.status).toBe('down');
    expect(dbHealth.error).toBe('Connection refused');
  });
});
