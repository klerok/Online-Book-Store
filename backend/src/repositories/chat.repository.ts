import prisma from "db";
import {
  ConversationStatus,
  ParticipantRole,
  UserRole,
} from "generated/prisma";

interface ListCustomerChatsOptions {
  status?: ConversationStatus;
  includeHidden?: boolean;
  take?: number;
  cursor?: number;
}
interface ListSupportChatsOptions {
  status?: ConversationStatus;
  take?: number;
  cursor?: number;
}

class ChatRepository {
  static async findParticipant(chatId: number, userId: number) {
    return prisma.chatParticipant.findFirst({
      where: { chatId, userId, leftAt: null },
      select: { id: true },
    });
  }

  static async addParticipant(
    chatId: number,
    userId: number,
    roleInChat: ParticipantRole
  ) {
    return prisma.chatParticipant.create({
      data: { chatId, userId, roleInChat },
    });
  }

  static async removeParticipant(chatId: number, userId: number) {
    return prisma.chatParticipant.updateMany({
      where: { chatId, userId, leftAt: null },
      data: { leftAt: new Date() },
    });
  }

  static async findOpenConversationByCustomerId(customerId: number) {
    return prisma.chatConversation.findFirst({
      where: { customerId, status: ConversationStatus.OPEN },
    });
  }

  static async createConversation(
    customerId: number,
    status: ConversationStatus
  ) {
    return prisma.chatConversation.create({
      data: { customerId, status },
    });
  }

  static async updateConversationStatus(
    chatId: number,
    status: ConversationStatus
  ) {
    return prisma.chatConversation.update({
      where: { chatId },
      data: { status },
    });
  }

  static async updateLastMessageAt(chatId: number, lastMessageAt: Date) {
    return prisma.chatConversation.update({
      where: { chatId },
      data: { lastMessageAt },
    });
  }

  static async findConversationById(chatId: number) {
    return prisma.chatConversation.findUnique({
      where: { chatId },
      select: { chatId: true },
    });
  }

  static async listConversationsForCustomer(
    customerId: number,
    options: ListCustomerChatsOptions = {}
  ) {
    const { status, includeHidden = false, take = 20, cursor } = options;
    return prisma.chatConversation.findMany({
      where: {
        customerId,
        ...(includeHidden ? {} : { hiddenByCustomerAt: null }),
        ...(status ? { status } : {}),
      },
      orderBy: [{ lastMessageAt: "desc" }, { updatedAt: "desc" }],
      take,
      ...(cursor ? { skip: 1, cursor: { chatId: cursor } } : {}),
      select: {
        chatId: true,
        customerId: true,
        status: true,
        lastMessageAt: true,
        updatedAt: true,
        hiddenByCustomerAt: true,
      },
    });
  }

  static async listConversationsForSupport(
    supportAgentId: number,
    options: ListSupportChatsOptions = {}
  ) {
    const { status, take = 20, cursor } = options;
    return prisma.chatParticipant.findMany({
      where: {
        userId: supportAgentId,
        leftAt: null,
        ...(status ? { conversation: { status } } : {}),
      },
      orderBy: { conversation: { lastMessageAt: "desc" } },
      take,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      select: {
        id: true,
        roleInChat: true,
        joinedAt: true,
        leftAt: true,
        conversation: {
          select: {
            chatId: true,
            customerId: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            lastMessageAt: true,
            hiddenByCustomerAt: true,
            customer: {
              select: {
                userId: true,
                username: true,
                email: true,
              },
            },
          },
        },
      },
    });
  }

  static async listConversationsForUser(
    userId: number,
    role: UserRole,
    options: ListCustomerChatsOptions | ListSupportChatsOptions = {}
  ) {
    if (role === UserRole.CUSTOMER) {
      return ChatRepository.listConversationsForCustomer(
        userId,
        options as ListCustomerChatsOptions
      );
    }
    if (role === UserRole.SUPPORT_AGENT) {
      return ChatRepository.listConversationsForSupport(
        userId,
        options as ListSupportChatsOptions
      );
    }
    return []
  }
}
