import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { WatchTogetherService } from '../watch-together.service';

@Processor('watch-session-cleanup')
export class WatchSessionCleanupProcessor extends WorkerHost {
  private readonly logger = new Logger(WatchSessionCleanupProcessor.name);

  constructor(private readonly watchTogether: WatchTogetherService) {
    super();
  }

  async process(job: Job<{ kind?: string }>): Promise<void> {
    void job;
    try {
      const n = await this.watchTogether.cleanupExpiredSessions();
      if (n > 0) {
        this.logger.log(`watch-session-cleanup: ended ${n} expired session(s)`);
      }
    } catch (err) {
      this.logger.warn(`watch-session-cleanup failed: ${String(err)}`);
    }
  }
}
