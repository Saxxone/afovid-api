-- CreateEnum
CREATE TYPE "WatchSessionStatus" AS ENUM ('ACTIVE', 'ENDED');

-- CreateTable
CREATE TABLE "WatchSession" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "hostId" TEXT NOT NULL,
    "status" "WatchSessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "currentPositionSeconds" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isPlaying" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WatchSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WatchSessionParticipant" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WatchSessionParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WatchSession_postId_idx" ON "WatchSession"("postId");

-- CreateIndex
CREATE INDEX "WatchSession_hostId_idx" ON "WatchSession"("hostId");

-- CreateIndex
CREATE INDEX "WatchSession_status_expiresAt_idx" ON "WatchSession"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "WatchSessionParticipant_userId_idx" ON "WatchSessionParticipant"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WatchSessionParticipant_sessionId_userId_key" ON "WatchSessionParticipant"("sessionId", "userId");

-- AddForeignKey
ALTER TABLE "WatchSession" ADD CONSTRAINT "WatchSession_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WatchSession" ADD CONSTRAINT "WatchSession_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WatchSessionParticipant" ADD CONSTRAINT "WatchSessionParticipant_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "WatchSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WatchSessionParticipant" ADD CONSTRAINT "WatchSessionParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
