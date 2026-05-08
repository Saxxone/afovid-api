export const WATCH_TOGETHER_SESSION_ENDED = 'watch-together.session-ended';

export type WatchTogetherSessionEndedPayload = {
  sessionId: string;
};

export const WATCH_PARTICIPANT_REJECTED = 'watch-together.participant-rejected';

export type WatchParticipantRejectedPayload = {
  sessionId: string;
  userId: string;
};

export const WATCH_PARTICIPANT_APPROVED = 'watch-together.participant-approved';

export type WatchParticipantApprovedPayload = {
  sessionId: string;
  userId: string;
};
