-- DropIndex
DROP INDEX "ChatConversation_customerId_key";

-- AlterTable
ALTER TABLE "ChatConversation" ADD COLUMN     "hiddenByCustomerAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "ChatConversation_one_open_per_customer_idx"
ON "ChatConversation" ("customerId")
WHERE "status" = 'OPEN';