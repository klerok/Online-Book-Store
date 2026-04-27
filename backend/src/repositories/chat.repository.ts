import prisma from "db";
import {
  ConversationStatus,
  ParticipantRole,
  UserRole,
} from "generated/prisma";
import type { ListCustomerChatsOptions } from "types/chat/repository.types";
class ChatRepository {
  static async createMessage(
    chatId: number,
    senderId: number,
    content: string
  ) {
    return prisma.chatMessage.create({
      data: { chatId, senderId, content },
      select: {
        messageId: true,
        chatId: true,
        senderId: true,
        content: true,
        createdAt: true,
      },
    });
  }

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
        ticket: { select: { title: true } },
      },
    });
  }

  static async listOpenConversationsForSupportQueue(take = 100) {
    return prisma.chatConversation.findMany({
      where: { status: ConversationStatus.OPEN },
      orderBy: [{ lastMessageAt: "desc" }, { updatedAt: "desc" }],
      take,
      select: {
        chatId: true,
        customerId: true,
        status: true,
        lastMessageAt: true,
        updatedAt: true,
        hiddenByCustomerAt: true,
        customer: {
          select: {
            userId: true,
            username: true,
            email: true,
          },
        },
        ticket: { select: { title: true } },
      },
    });
  }

  static async listConversationsForUser(
    userId: number,
    role: UserRole,
    options: ListCustomerChatsOptions = {}
  ) {
    if (role === UserRole.CUSTOMER) {
      return ChatRepository.listConversationsForCustomer(
        userId,
        options as ListCustomerChatsOptions
      );
    }
    if (
      role === UserRole.SUPPORT_AGENT ||
      role === UserRole.ADMIN
    ) {
      const rows = await ChatRepository.listOpenConversationsForSupportQueue();
      return rows.map((conversation) => ({ conversation }));
    }
    return [];
  }

  static async listMessages(chatId: number, take = 50) {
    return prisma.chatMessage.findMany({
      where: { chatId },
      orderBy: { createdAt: "desc" },
      take,
      select: {
        messageId: true,
        chatId: true,
        senderId: true,
        content: true,
        createdAt: true,
      },
    });
  }

  static async findTicketByChatId(chatId: number) {
    return prisma.ticket.findUnique({
      where: { chatId },
      select: {
        ticketId: true,
        title: true,
        description: true,
        ticketStatus: true,
        chatId: true,
      },
    });
  }
}

export default ChatRepository;
