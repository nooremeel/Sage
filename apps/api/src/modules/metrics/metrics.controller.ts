import { Controller, Get, Header } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator.js';

@ApiTags('metrics')
@Controller('metrics')
export class MetricsController {
  private readonly startTime = Date.now();

  @Get()
  @Public()
  @Header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  @ApiOperation({ summary: 'Prometheus metrics endpoint' })
  getMetrics(): string {
    const mem = process.memoryUsage();
    const uptimeSec = Math.floor((Date.now() - this.startTime) / 1000);
    const cpu = process.cpuUsage();

    return [
      '# HELP process_resident_memory_bytes Resident memory size in bytes.',
      '# TYPE process_resident_memory_bytes gauge',
      `process_resident_memory_bytes ${mem.rss}`,
      '# HELP process_heap_bytes Process heap size in bytes.',
      '# TYPE process_heap_bytes gauge',
      `process_heap_bytes ${mem.heapUsed}`,
      '# HELP process_heap_total_bytes Total process heap size in bytes.',
      '# TYPE process_heap_total_bytes gauge',
      `process_heap_total_bytes ${mem.heapTotal}`,
      '# HELP process_cpu_user_seconds_total Total user CPU time spent in seconds.',
      '# TYPE process_cpu_user_seconds_total counter',
      `process_cpu_user_seconds_total ${(cpu.user / 1e6).toFixed(4)}`,
      '# HELP process_cpu_system_seconds_total Total system CPU time spent in seconds.',
      '# TYPE process_cpu_system_seconds_total counter',
      `process_cpu_system_seconds_total ${(cpu.system / 1e6).toFixed(4)}`,
      '# HELP sage_uptime_seconds Uptime of the Sage application service in seconds.',
      '# TYPE sage_uptime_seconds gauge',
      `sage_uptime_seconds ${uptimeSec}`,
      '# HELP sage_app_status Sage service operational status.',
      '# TYPE sage_app_status gauge',
      'sage_app_status{status="healthy"} 1',
    ].join('\n');
  }
}

