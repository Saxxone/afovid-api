import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ChatModule } from 'src/chat/chat.module';
import { WatchTogetherController } from './watch-together.controller';
import { WatchTogetherService } from './watch-together.service';
import { WatchSessionCleanupProcessor } from './processors/watch-session-cleanup.processor';
import { WatchTogetherEndedListener } from './watch-together-ended.listener';
import { WatchParticipantRejectedListener } from './watch-participant-rejected.listener';

@Module({
  imports: [
    PrismaModule,
    BullModule.registerQueue({ name: 'watch-session-cleanup' }),
    forwardRef(() => ChatModule),
  ],
  controllers: [WatchTogetherController],
  providers: [
    WatchTogetherService,
    WatchSessionCleanupProcessor,
    WatchTogetherEndedListener,
    WatchParticipantRejectedListener,
  ],
  exports: [WatchTogetherService],
})
export class WatchTogetherModule {}
