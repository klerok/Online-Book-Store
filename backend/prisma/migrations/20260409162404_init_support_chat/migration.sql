/*
  Warnings:

  - You are about to drop the column `supportAgentId` on the `ChatConversation` table. All the data in the column will be lost.
  - The `status` column on the `ChatConversation` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[customerId]` on the table `ChatConversation` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "ConversationStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "ParticipantRole" AS ENUM ('CUSTOMER', 'SUPPORT_AGENT');

-- DropForeignKey
ALTER TABLE "ChatConversation" DROP CONSTRAINT "ChatConversation_supportAgentId_fkey";

-- DropIndex
DROP INDEX "ChatConversation_customerId_idx";

-- DropIndex
DROP INDEX "ChatConversation_supportAgentId_idx";

-- AlterTable
ALTER TABLE "ChatConversation" DROP COLUMN "supportAgentId",
ADD COLUMN     "lastMessageAt" TIMESTAMP(3),
DROP COLUMN "status",
ADD COLUMN     "status" "ConversationStatus" NOT NULL DEFAULT 'OPEN';

-- CreateTable
CREATE TABLE "ChatParticipant" (
    "id" SERIAL NOT NULL,
    "chatId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "roleInChat" "ParticipantRole" NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),

    CONSTRAINT "ChatParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChatParticipant_userId_idx" ON "ChatParticipant"("userId");

-- CreateIndex
CREATE INDEX "ChatParticipant_chatId_roleInChat_idx" ON "ChatParticipant"("chatId", "roleInChat");

-- CreateIndex
CREATE UNIQUE INDEX "ChatParticipant_chatId_userId_key" ON "ChatParticipant"("chatId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "ChatConversation_customerId_key" ON "ChatConversation"("customerId");

-- CreateIndex
CREATE INDEX "ChatConversation_status_idx" ON "ChatConversation"("status");

-- CreateIndex
CREATE INDEX "ChatConversation_lastMessageAt_idx" ON "ChatConversation"("lastMessageAt");

-- AddForeignKey
ALTER TABLE "ChatParticipant" ADD CONSTRAINT "ChatParticipant_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "ChatConversation"("chatId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatParticipant" ADD CONSTRAINT "ChatParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
