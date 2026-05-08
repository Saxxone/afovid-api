import { Controller, Get, UseGuards } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import {
  DiskHealthIndicator,
  HealthCheck,
  HealthCheckService,
  HttpHealthIndicator,
  MemoryHealthIndicator,
  PrismaHealthIndicator,
} from '@nestjs/terminus';
import { Public } from 'src/auth/auth.guard';
import { RequiresFeatureFlag } from 'src/feature-flag/feature-flag.decorator';
import { FeatureFlagGuard } from 'src/feature-flag/feature-flag.guard';
import { api_base_url, ui_base_url } from '../utils';

@SkipThrottle()
@Controller('health')
@UseGuards(FeatureFlagGuard)
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly http: HttpHealthIndicator,
    private readonly db: PrismaHealthIndicator,
    private readonly disk: DiskHealthIndicator,
    private readonly memory: MemoryHealthIndicator,
  ) {}

  url = api_base_url;
  ui_url = ui_base_url;

  @Public()
  @RequiresFeatureFlag('platform.healthChecks')
  @Get('api')
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.http.pingCheck('afovid-api', this.url + '/hello'),
    ]);
  }

  @Public()
  @RequiresFeatureFlag('platform.healthChecks')
  @Get('ui')
  @HealthCheck()
  checkFrontend() {
    return this.health.check([
      () =>
        this.http.responseCheck(
          'afovid-web',
          this.ui_url + '/login',
          (res) => res.status === 200,
        ),
    ]);
  }

  @Public()
  @RequiresFeatureFlag('platform.healthChecks')
  @Get('db')
  @HealthCheck()
  databaseCheck() {
    return this.health.check([
      () => this.http.pingCheck('afovid-db', 'database'),
    ]);
  }

  @Public()
  @RequiresFeatureFlag('platform.healthChecks')
  @Get('storage')
  @HealthCheck()
  storageCheck() {
    return this.health.check([
      () =>
        this.disk.checkStorage('storage', { path: '/', thresholdPercent: 0.5 }),
    ]);
  }

  @Public()
  @RequiresFeatureFlag('platform.healthChecks')
  @Get('memory')
  @HealthCheck()
  memoryCheck() {
    return this.health.check([
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
    ]);
  }
}
