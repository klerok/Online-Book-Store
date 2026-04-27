import type { ConversationStatus } from "generated/prisma";

export interface ListCustomerChatsOptions {
  status?: ConversationStatus;
  includeHidden?: boolean;
  take?: number;
  cursor?: number;
}
