-- CreateEnum
CREATE TYPE "WatchParticipantStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "WatchSession" ADD COLUMN     "require_host_approval" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "WatchSessionParticipant" ADD COLUMN     "status" "WatchParticipantStatus" NOT NULL DEFAULT 'APPROVED';

-- CreateTable
CREATE TABLE "WatchSessionMessage" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "body" VARCHAR(2000) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "WatchSessionMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WatchSessionMessage_sessionId_createdAt_idx" ON "WatchSessionMessage"("sessionId", "createdAt");

-- CreateIndex
CREATE INDEX "WatchSessionParticipant_sessionId_status_idx" ON "WatchSessionParticipant"("sessionId", "status");

-- AddForeignKey
ALTER TABLE "WatchSessionMessage" ADD CONSTRAINT "WatchSessionMessage_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "WatchSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WatchSessionMessage" ADD CONSTRAINT "WatchSessionMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
