import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ChatGateway } from 'src/chat/chat.gateway';
import {
  WATCH_PARTICIPANT_REJECTED,
  type WatchParticipantRejectedPayload,
} from './watch-together.events';

@Injectable()
export class WatchParticipantRejectedListener {
  constructor(
    @Inject(forwardRef(() => ChatGateway))
    private readonly chatGateway: ChatGateway,
  ) {}

  @OnEvent(WATCH_PARTICIPANT_REJECTED)
  handleRejected(payload: WatchParticipantRejectedPayload): void {
    this.chatGateway.kickUserFromWatchSession(payload.sessionId, payload.userId);
    void this.chatGateway.emitWatchParticipantUpdate(payload.sessionId);
  }
}
