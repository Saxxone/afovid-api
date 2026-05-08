import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { RequiresFeatureFlag } from 'src/feature-flag/feature-flag.decorator';
import { FeatureFlagGuard } from 'src/feature-flag/feature-flag.guard';
import { CreateWatchSessionDto } from './dto/create-watch-session.dto';
import { WatchTogetherService } from './watch-together.service';

@Controller('watch-together')
@UseGuards(FeatureFlagGuard)
export class WatchTogetherController {
  constructor(private readonly watchTogether: WatchTogetherService) {}

  @RequiresFeatureFlag('social.watchTogether')
  @Post()
  async create(
    @Request() req: { user: { userId: string } },
    @Body() dto: CreateWatchSessionDto,
  ) {
    return this.watchTogether.createSession(
      req.user.userId,
      dto.postId,
      dto.requireHostApproval ?? false,
    );
  }

  @RequiresFeatureFlag('social.watchTogether')
  @Get(':id')
  async getOne(
    @Request() req: { user: { userId: string } },
    @Param('id') id: string,
  ) {
    return this.watchTogether.getSessionForUser(id, req.user.userId);
  }

  @RequiresFeatureFlag(
    'social.watchTogether',
    'social.watchTogetherHostApproval',
  )
  @Post(':id/participants/:participantUserId/approve')
  async approveParticipant(
    @Request() req: { user: { userId: string } },
    @Param('id') id: string,
    @Param('participantUserId') participantUserId: string,
  ) {
    return this.watchTogether.approveParticipant(
      id,
      req.user.userId,
      participantUserId,
    );
  }

  @RequiresFeatureFlag(
    'social.watchTogether',
    'social.watchTogetherHostApproval',
  )
  @Post(':id/participants/:participantUserId/reject')
  async rejectParticipant(
    @Request() req: { user: { userId: string } },
    @Param('id') id: string,
    @Param('participantUserId') participantUserId: string,
  ) {
    return this.watchTogether.rejectParticipant(
      id,
      req.user.userId,
      participantUserId,
    );
  }

  @RequiresFeatureFlag('social.watchTogether')
  @Post(':id/end')
  async end(
    @Request() req: { user: { userId: string } },
    @Param('id') id: string,
  ) {
    return this.watchTogether.endSession(id, req.user.userId);
  }
}
