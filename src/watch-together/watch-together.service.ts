import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Queue } from 'bullmq';
import {
  Prisma,
  WatchParticipantStatus,
  WatchSessionStatus,
} from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  WATCH_TOGETHER_SESSION_ENDED,
  type WatchTogetherSessionEndedPayload,
  WATCH_PARTICIPANT_REJECTED,
  type WatchParticipantRejectedPayload,
  WATCH_PARTICIPANT_APPROVED,
  type WatchParticipantApprovedPayload,
} from './watch-together.events';

const SESSION_TTL_MS = 6 * 60 * 60 * 1000;
const WATCH_CHAT_HISTORY_CAP = 100;

const PARTICIPANT_USER_SELECT = {
  id: true,
  email: true,
  username: true,
  img: true,
  verified: true,
  name: true,
} as const;

export function postRecordHasVideoMedia(post: {
  mediaTypes: string[];
  longPost?: { content?: Array<{ mediaTypes?: string[] }> } | null;
}): boolean {
  if (post.mediaTypes?.includes('video')) return true;
  return (post.longPost?.content ?? []).some((b) =>
    (b.mediaTypes ?? []).includes('video'),
  );
}

const sessionDetailInclude = {
  post: {
    select: {
      id: true,
      authorId: true,
      text: true,
      media: true,
      mediaTypes: true,
      published: true,
      monetizationEnabled: true,
    },
  },
  host: { select: PARTICIPANT_USER_SELECT },
  participants: {
    include: { user: { select: PARTICIPANT_USER_SELECT } },
    orderBy: { joinedAt: Prisma.SortOrder.asc },
  },
} as const;

type SessionDetail = Prisma.WatchSessionGetPayload<{
  include: typeof sessionDetailInclude;
}>;

@Injectable()
export class WatchTogetherService implements OnModuleInit {
  private readonly logger = new Logger(WatchTogetherService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    @InjectQueue('watch-session-cleanup')
    private readonly cleanupQueue: Queue,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.cleanupQueue.add(
        'expire-sessions',
        {},
        {
          repeat: { every: 5 * 60 * 1000 },
          jobId: 'watch-together-expire-sessions',
        },
      );
    } catch (err) {
      this.logger.warn(
        `watch-together cleanup repeat schedule failed: ${String(err)}`,
      );
    }
  }

  private async loadPostForWatch(postId: string) {
    return this.prisma.post.findFirst({
      where: { id: postId, deletedAt: null, published: true },
      include: {
        longPost: {
          select: { content: { select: { mediaTypes: true } } },
        },
      },
    });
  }

  /**
   * Author always allowed; non-monetized allowed; monetized requires unlock row.
   */
  async assertUserCanAccessPostVideo(userId: string, postId: string) {
    const post = await this.loadPostForWatch(postId);
    if (!post) {
      throw new NotFoundException('Post not found');
    }
    if (!postRecordHasVideoMedia(post)) {
      throw new BadRequestException('Post has no video');
    }
    if (post.authorId === userId) {
      return post;
    }
    if (!post.monetizationEnabled) {
      return post;
    }
    const unlock = await this.prisma.postUnlock.findUnique({
      where: { userId_postId: { userId, postId } },
    });
    if (!unlock) {
      throw new ForbiddenException(
        'Unlock this post with coins to watch together',
      );
    }
    return post;
  }

  async createSession(
    hostId: string,
    postId: string,
    requireHostApproval = false,
  ) {
    await this.assertUserCanAccessPostVideo(hostId, postId);
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
    return this.prisma.watchSession.create({
      data: {
        postId,
        hostId,
        requireHostApproval,
        expiresAt,
        participants: {
          create: {
            userId: hostId,
            status: WatchParticipantStatus.APPROVED,
          },
        },
      },
      include: sessionDetailInclude,
    });
  }

  private async assertSessionJoinableForRegister(sessionId: string) {
    const session = await this.prisma.watchSession.findUnique({
      where: { id: sessionId },
      select: {
        postId: true,
        status: true,
        expiresAt: true,
        hostId: true,
        requireHostApproval: true,
      },
    });
    if (!session) {
      throw new NotFoundException('Watch session not found');
    }
    if (session.status !== WatchSessionStatus.ACTIVE) {
      throw new BadRequestException('This watch session has ended');
    }
    if (session.expiresAt.getTime() <= Date.now()) {
      throw new BadRequestException('This watch session has expired');
    }
    return session;
  }

  /**
   * Creates or refreshes participant row (PENDING when approval required).
   * Returns whether viewer is still pending and whether this call newly entered pending.
   */
  async registerParticipantForSession(
    sessionId: string,
    userId: string,
  ): Promise<{ isPending: boolean; isNewPending: boolean }> {
    const session = await this.assertSessionJoinableForRegister(sessionId);
    await this.assertUserCanAccessPostVideo(userId, session.postId);

    if (session.hostId === userId) {
      await this.prisma.watchSessionParticipant.upsert({
        where: { sessionId_userId: { sessionId, userId } },
        create: {
          sessionId,
          userId,
          status: WatchParticipantStatus.APPROVED,
        },
        update: { status: WatchParticipantStatus.APPROVED },
      });
      return { isPending: false, isNewPending: false };
    }

    const desiredStatus = session.requireHostApproval
      ? WatchParticipantStatus.PENDING
      : WatchParticipantStatus.APPROVED;

    const existing = await this.prisma.watchSessionParticipant.findUnique({
      where: { sessionId_userId: { sessionId, userId } },
    });

    if (!existing) {
      await this.prisma.watchSessionParticipant.create({
        data: { sessionId, userId, status: desiredStatus },
      });
      return {
        isPending: desiredStatus === WatchParticipantStatus.PENDING,
        isNewPending: desiredStatus === WatchParticipantStatus.PENDING,
      };
    }

    if (existing.status === WatchParticipantStatus.REJECTED) {
      await this.prisma.watchSessionParticipant.update({
        where: { sessionId_userId: { sessionId, userId } },
        data: { status: desiredStatus },
      });
      return {
        isPending: desiredStatus === WatchParticipantStatus.PENDING,
        isNewPending: desiredStatus === WatchParticipantStatus.PENDING,
      };
    }

    return {
      isPending: existing.status === WatchParticipantStatus.PENDING,
      isNewPending: false,
    };
  }

  private shapePendingSessionResponse(detail: SessionDetail) {
    return {
      id: detail.id,
      postId: detail.postId,
      hostId: detail.hostId,
      status: detail.status,
      requireHostApproval: detail.requireHostApproval,
      expiresAt: detail.expiresAt,
      currentPositionSeconds: detail.currentPositionSeconds,
      isPlaying: detail.isPlaying,
      createdAt: detail.createdAt,
      updatedAt: detail.updatedAt,
      viewerParticipantStatus: 'PENDING' as const,
      post: { id: detail.post.id },
      host: detail.host,
      participants: detail.participants
        .filter((p) => p.status === WatchParticipantStatus.APPROVED)
        .map((p) => ({
          id: p.id,
          sessionId: p.sessionId,
          userId: p.userId,
          status: p.status,
          joinedAt: p.joinedAt,
          user: p.user,
        })),
      pendingParticipants: detail.participants
        .filter((p) => p.status === WatchParticipantStatus.PENDING)
        .map((p) => ({
          id: p.id,
          userId: p.userId,
          joinedAt: p.joinedAt,
          user: p.user,
        })),
    };
  }

  async getSessionForUser(sessionId: string, userId: string) {
    let detail = await this.findSessionDetail(sessionId);
    if (!detail) {
      throw new NotFoundException('Watch session not found');
    }

    const isHost = detail.hostId === userId;
    let self = detail.participants.find((p) => p.userId === userId);

    if (!isHost && !self) {
      await this.registerParticipantForSession(sessionId, userId);
      detail = await this.findSessionDetail(sessionId);
      if (!detail) {
        throw new NotFoundException('Watch session not found');
      }
      self = detail.participants.find((p) => p.userId === userId);
    }

    if (!isHost && !self) {
      throw new NotFoundException('Watch session not found');
    }

    if (!isHost && self!.status === WatchParticipantStatus.REJECTED) {
      throw new ForbiddenException('You cannot join this watch session');
    }

    if (!isHost && self!.status === WatchParticipantStatus.PENDING) {
      return this.shapePendingSessionResponse(detail);
    }

    return {
      ...detail,
      viewerParticipantStatus: 'APPROVED' as const,
      requireHostApproval: detail.requireHostApproval,
    };
  }

  /** Read room join state after `registerParticipantForSession`. */
  async readSocketJoinState(
    sessionId: string,
    userId: string,
  ): Promise<
    | { kind: 'approved'; detail: SessionDetail }
    | { kind: 'pending' }
    | { kind: 'rejected' }
  > {
    const row = await this.prisma.watchSessionParticipant.findUnique({
      where: { sessionId_userId: { sessionId, userId } },
    });
    const session = await this.prisma.watchSession.findUnique({
      where: { id: sessionId },
      select: { hostId: true },
    });
    if (!row || !session) {
      throw new NotFoundException('Watch session not found');
    }
    if (session.hostId === userId) {
      const detail = await this.findSessionDetail(sessionId);
      if (!detail) {
        throw new NotFoundException('Watch session not found');
      }
      return { kind: 'approved', detail };
    }
    if (row.status === WatchParticipantStatus.REJECTED) {
      return { kind: 'rejected' };
    }
    if (row.status === WatchParticipantStatus.PENDING) {
      return { kind: 'pending' };
    }
    const detail = await this.findSessionDetail(sessionId);
    if (!detail) {
      throw new NotFoundException('Watch session not found');
    }
    return { kind: 'approved', detail };
  }

  async approveParticipant(
    sessionId: string,
    hostId: string,
    targetUserId: string,
  ) {
    const session = await this.prisma.watchSession.findUnique({
      where: { id: sessionId },
      select: { hostId: true, status: true },
    });
    if (!session) {
      throw new NotFoundException('Watch session not found');
    }
    if (session.hostId !== hostId) {
      throw new ForbiddenException('Only the host can approve participants');
    }
    if (targetUserId === hostId) {
      throw new BadRequestException('Cannot approve the host');
    }
    const res = await this.prisma.watchSessionParticipant.updateMany({
      where: {
        sessionId,
        userId: targetUserId,
        status: WatchParticipantStatus.PENDING,
      },
      data: { status: WatchParticipantStatus.APPROVED },
    });
    if (res.count === 0) {
      throw new NotFoundException('No pending request for this user');
    }
    this.eventEmitter.emit(WATCH_PARTICIPANT_APPROVED, {
      sessionId,
      userId: targetUserId,
    } satisfies WatchParticipantApprovedPayload);
    return this.findSessionDetail(sessionId);
  }

  async rejectParticipant(
    sessionId: string,
    hostId: string,
    targetUserId: string,
  ) {
    const session = await this.prisma.watchSession.findUnique({
      where: { id: sessionId },
      select: { hostId: true },
    });
    if (!session) {
      throw new NotFoundException('Watch session not found');
    }
    if (session.hostId !== hostId) {
      throw new ForbiddenException('Only the host can reject participants');
    }
    if (targetUserId === hostId) {
      throw new BadRequestException('Cannot reject the host');
    }
    const res = await this.prisma.watchSessionParticipant.updateMany({
      where: {
        sessionId,
        userId: targetUserId,
        status: WatchParticipantStatus.PENDING,
      },
      data: { status: WatchParticipantStatus.REJECTED },
    });
    if (res.count === 0) {
      throw new NotFoundException('No pending request for this user');
    }
    this.eventEmitter.emit(WATCH_PARTICIPANT_REJECTED, {
      sessionId,
      userId: targetUserId,
    } satisfies WatchParticipantRejectedPayload);
    return { ok: true as const };
  }

  async appendSessionChatMessage(
    sessionId: string,
    userId: string,
    rawBody: string,
  ) {
    const body = rawBody.trim().slice(0, 2000);
    if (!body) {
      throw new BadRequestException('Message cannot be empty');
    }
    await this.assertApprovedParticipant(sessionId, userId);
    const msg = await this.prisma.watchSessionMessage.create({
      data: { sessionId, userId, body },
      include: { user: { select: PARTICIPANT_USER_SELECT } },
    });
    return {
      id: msg.id,
      sessionId: msg.sessionId,
      userId: msg.userId,
      body: msg.body,
      createdAt: msg.createdAt,
      user: msg.user,
    };
  }

  async listSessionChatHistory(
    sessionId: string,
    userId: string,
    take = WATCH_CHAT_HISTORY_CAP,
  ) {
    await this.assertApprovedParticipant(sessionId, userId);
    const lim = Math.min(Math.max(take, 1), 200);
    const rows = await this.prisma.watchSessionMessage.findMany({
      where: { sessionId, deletedAt: null },
      orderBy: { createdAt: 'asc' },
      take: lim,
      skip: Math.max(
        0,
        (await this.prisma.watchSessionMessage.count({
          where: { sessionId, deletedAt: null },
        })) - lim,
      ),
      include: { user: { select: PARTICIPANT_USER_SELECT } },
    });
    return rows;
  }

  async assertApprovedParticipant(sessionId: string, userId: string) {
    const session = await this.prisma.watchSession.findUnique({
      where: { id: sessionId },
      select: { hostId: true, status: true, expiresAt: true },
    });
    if (!session) {
      throw new NotFoundException('Watch session not found');
    }
    if (session.status !== WatchSessionStatus.ACTIVE) {
      throw new BadRequestException('This watch session has ended');
    }
    if (session.expiresAt.getTime() <= Date.now()) {
      throw new BadRequestException('This watch session has expired');
    }
    if (session.hostId === userId) {
      return;
    }
    const row = await this.prisma.watchSessionParticipant.findUnique({
      where: { sessionId_userId: { sessionId, userId } },
    });
    if (!row || row.status !== WatchParticipantStatus.APPROVED) {
      throw new ForbiddenException('Not part of this watch session');
    }
  }

  async deleteSessionMessages(sessionId: string): Promise<void> {
    await this.prisma.watchSessionMessage.deleteMany({ where: { sessionId } });
  }

  async leaveSession(sessionId: string, userId: string) {
    const session = await this.prisma.watchSession.findUnique({
      where: { id: sessionId },
      select: { hostId: true },
    });
    if (!session) {
      return;
    }
    if (session.hostId === userId) {
      await this.endSession(sessionId, userId);
      return;
    }
    await this.prisma.watchSessionParticipant.deleteMany({
      where: { sessionId, userId },
    });
  }

  async updatePlaybackState(
    sessionId: string,
    userId: string,
    position: number,
    isPlaying: boolean,
  ) {
    const session = await this.prisma.watchSession.findUnique({
      where: { id: sessionId },
      select: {
        status: true,
        expiresAt: true,
      },
    });
    if (!session) {
      throw new NotFoundException('Watch session not found');
    }
    if (session.status !== WatchSessionStatus.ACTIVE) {
      throw new BadRequestException('This watch session has ended');
    }
    if (session.expiresAt.getTime() <= Date.now()) {
      throw new BadRequestException('This watch session has expired');
    }
    const participant = await this.prisma.watchSessionParticipant.findUnique({
      where: { sessionId_userId: { sessionId, userId } },
    });
    if (
      !participant ||
      participant.status !== WatchParticipantStatus.APPROVED
    ) {
      throw new ForbiddenException('Not part of this watch session');
    }

    const safe = Number.isFinite(position) ? Math.max(0, position) : 0;
    return this.prisma.watchSession.update({
      where: { id: sessionId },
      data: {
        currentPositionSeconds: safe,
        isPlaying,
      },
      select: {
        id: true,
        currentPositionSeconds: true,
        isPlaying: true,
        hostId: true,
      },
    });
  }

  async findSessionDetail(sessionId: string) {
    return this.prisma.watchSession.findUnique({
      where: { id: sessionId },
      include: sessionDetailInclude,
    });
  }

  getUserPublicSummary(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: PARTICIPANT_USER_SELECT,
    });
  }

  async getPlaybackStateForParticipant(sessionId: string, userId: string) {
    await this.assertApprovedParticipant(sessionId, userId);
    const row = await this.prisma.watchSession.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        currentPositionSeconds: true,
        isPlaying: true,
        status: true,
        hostId: true,
      },
    });
    if (!row) {
      throw new NotFoundException('Watch session not found');
    }
    return row;
  }

  async getParticipantPayload(sessionId: string) {
    const session = await this.prisma.watchSession.findUnique({
      where: { id: sessionId },
      select: { hostId: true },
    });
    if (!session) {
      return null;
    }
    const rows = await this.prisma.watchSessionParticipant.findMany({
      where: { sessionId, status: WatchParticipantStatus.APPROVED },
      include: { user: { select: PARTICIPANT_USER_SELECT } },
      orderBy: { joinedAt: Prisma.SortOrder.asc },
    });
    return {
      hostId: session.hostId,
      participants: rows.map((r) => r.user),
    };
  }

  async endSession(sessionId: string, userId: string) {
    const session = await this.prisma.watchSession.findUnique({
      where: { id: sessionId },
      select: { hostId: true, status: true },
    });
    if (!session) {
      throw new NotFoundException('Watch session not found');
    }
    if (session.hostId !== userId) {
      throw new ForbiddenException('Only the host can end this session');
    }
    if (session.status === WatchSessionStatus.ENDED) {
      return { ended: true };
    }
    await this.prisma.watchSession.update({
      where: { id: sessionId },
      data: { status: WatchSessionStatus.ENDED },
    });
    await this.deleteSessionMessages(sessionId);
    const payload: WatchTogetherSessionEndedPayload = { sessionId };
    this.eventEmitter.emit(WATCH_TOGETHER_SESSION_ENDED, payload);
    return { ended: true };
  }

  /** Mark ACTIVE sessions past `expiresAt` as ENDED; emits `watch-together.session-ended` per row. */
  async cleanupExpiredSessions(): Promise<number> {
    const stale = await this.prisma.watchSession.findMany({
      where: {
        status: WatchSessionStatus.ACTIVE,
        expiresAt: { lt: new Date() },
      },
      select: { id: true },
    });
    let n = 0;
    for (const row of stale) {
      await this.prisma.watchSession.update({
        where: { id: row.id },
        data: { status: WatchSessionStatus.ENDED },
      });
      await this.deleteSessionMessages(row.id);
      this.eventEmitter.emit(WATCH_TOGETHER_SESSION_ENDED, {
        sessionId: row.id,
      } satisfies WatchTogetherSessionEndedPayload);
      n += 1;
    }
    return n;
  }
}
