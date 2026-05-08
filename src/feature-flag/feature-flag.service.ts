import {
  Injectable,
  OnModuleInit,
  ForbiddenException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { FeatureFlagScope } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  FEATURE_FLAG_DEFINITIONS,
  FeatureFlagDefinition,
} from './feature-flag.constants';

const FEATURE_DISABLED_MESSAGE = 'This feature is currently disabled.';

@Injectable()
export class FeatureFlagService implements OnModuleInit {
  private readonly logger = new Logger(FeatureFlagService.name);
  /** Short-lived cache to avoid DB hits on hot paths */
  private enabledCache = new Map<string, boolean>();
  private cacheExpiresAt = 0;
  private readonly cacheTtlMs = 5_000;

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit(): Promise<void> {
    await this.syncDefinitions();
  }

  /**
   * Insert missing flags and refresh metadata; never overwrite `enabled`.
   */
  async syncDefinitions(): Promise<void> {
    for (const def of FEATURE_FLAG_DEFINITIONS) {
      await this.prisma.featureFlag.upsert({
        where: { key: def.key },
        create: {
          key: def.key,
          group: def.group,
          description: def.description,
          scope: def.scope,
          enabled: true,
        },
        update: {
          group: def.group,
          description: def.description,
          scope: def.scope,
        },
      });
    }
    this.bumpCache();
    const count = await this.prisma.featureFlag.count();
    this.logger.log(`Feature flags synced (${count} rows)`);
  }

  bumpCache(): void {
    this.enabledCache.clear();
    this.cacheExpiresAt = 0;
  }

  private async loadEnabledMap(): Promise<Map<string, boolean>> {
    const now = Date.now();
    if (now < this.cacheExpiresAt && this.enabledCache.size > 0) {
      return this.enabledCache;
    }
    const rows = await this.prisma.featureFlag.findMany({
      select: { key: true, enabled: true },
    });
    const map = new Map(rows.map((r) => [r.key, r.enabled]));
    this.enabledCache = map;
    this.cacheExpiresAt = now + this.cacheTtlMs;
    return map;
  }

  async isEnabled(key: string): Promise<boolean> {
    const map = await this.loadEnabledMap();
    if (!map.has(key)) {
      this.logger.warn(`Unknown feature flag key: ${key}`);
      return true;
    }
    return map.get(key) === true;
  }

  async assertEnabled(key: string): Promise<void> {
    const ok = await this.isEnabled(key);
    if (!ok) {
      throw new ForbiddenException({
        statusCode: 403,
        message: FEATURE_DISABLED_MESSAGE,
        code: 'FEATURE_DISABLED',
        flag: key,
      });
    }
  }

  async getPublicFlagMap(): Promise<Record<string, boolean>> {
    const rows = await this.prisma.featureFlag.findMany({
      where: { scope: FeatureFlagScope.CLIENT_SAFE },
      select: { key: true, enabled: true },
      orderBy: [{ group: 'asc' }, { key: 'asc' }],
    });
    return Object.fromEntries(rows.map((r) => [r.key, r.enabled]));
  }

  async findAllForAdmin(): Promise<
    Array<{
      id: string;
      key: string;
      group: string;
      enabled: boolean;
      description: string;
      scope: FeatureFlagScope;
      updatedAt: Date;
      updatedByEmail: string | null;
    }>
  > {
    return this.prisma.featureFlag.findMany({
      orderBy: [{ group: 'asc' }, { key: 'asc' }],
    });
  }

  async findOneByKey(key: string) {
    return this.prisma.featureFlag.findUnique({ where: { key } });
  }

  async patchFlag(
    key: string,
    enabled: boolean,
    updatedByEmail: string,
  ): Promise<void> {
    try {
      await this.prisma.featureFlag.update({
        where: { key },
        data: { enabled, updatedByEmail },
      });
    } catch {
      throw new NotFoundException(`Unknown flag key: ${key}`);
    }
    this.bumpCache();
  }

  getDefinitions(): FeatureFlagDefinition[] {
    return FEATURE_FLAG_DEFINITIONS;
  }
}
