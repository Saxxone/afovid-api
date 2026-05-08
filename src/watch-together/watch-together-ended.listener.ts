import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ChatGateway } from 'src/chat/chat.gateway';
import {
  WATCH_TOGETHER_SESSION_ENDED,
  type WatchTogetherSessionEndedPayload,
  WATCH_PARTICIPANT_APPROVED,
  type WatchParticipantApprovedPayload,
} from './watch-together.events';

@Injectable()
export class WatchTogetherEndedListener {
  constructor(
    @Inject(forwardRef(() => ChatGateway))
    private readonly chatGateway: ChatGateway,
  ) {}

  @OnEvent(WATCH_TOGETHER_SESSION_ENDED)
  handleEnded(payload: WatchTogetherSessionEndedPayload): void {
    this.chatGateway.broadcastWatchEnded(payload.sessionId);
  }

  @OnEvent(WATCH_PARTICIPANT_APPROVED)
  handleApproved(payload: WatchParticipantApprovedPayload): void {
    this.chatGateway.notifyWatchInviteApproved(
      payload.sessionId,
      payload.userId,
    );
    void this.chatGateway.emitWatchParticipantUpdate(payload.sessionId);
  }
}
