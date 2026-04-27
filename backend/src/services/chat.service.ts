import prisma from "db";
import {
  ConversationStatus,
  ParticipantRole,
  UserRole,
} from "generated/prisma";
import AuthRepository from "repositories/auth.repository";
import ChatRepository from "repositories/chat.repository";
import type { CreateTicketInput, SupportRoomId } from "types/chat/domain.types";
import type {
  AddUserMessageParams,
  JoinRoomParams,
} from "types/chat/service.types";

const MAX_MESSAGE_LENGTH = 2000;
const MAX_TITLE_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 5000;
const DEFAULT_HISTORY_TAKE = 50;

function normalizeText(text: string): string {
  return text.trim().replace(/\s+/g, " ");
}

class ChatService {
  static async getRoomHistory(
    room: SupportRoomId,
    take = DEFAULT_HISTORY_TAKE
  ) {
    const newestFirst = await ChatRepository.listMessages(room, take);
    return [...newestFirst].reverse();
  }

  static async addUserMessage(params: AddUserMessageParams) {
    const content = normalizeText(params.text);
    if (!content) throw new Error("Empty message");
    if (content.length > MAX_MESSAGE_LENGTH)
      throw new Error("Message too long");

    const chat = await ChatRepository.findConversationById(params.room);
    if (!chat) throw new Error("Chat not found");

    const participant = await ChatRepository.findParticipant(
      chat.chatId,
      params.userId
    );
    if (!participant)
      throw new Error("User is not a participant of this chat");

    const message = await ChatRepository.createMessage(
      chat.chatId,
      params.userId,
      content
    );
    await ChatRepository.updateLastMessageAt(chat.chatId, new Date());
    return message;
  }

  static async joinRoom(params: JoinRoomParams) {
    const { userId, room: chatId } = params;
    const chat = await ChatRepository.findConversationById(chatId);
    if (!chat) throw new Error("Chat not found");
    const user = await AuthRepository.findPublicById(userId);
    if (!user) throw new Error("User not found");

    const roleInChat =
      user.role === UserRole.SUPPORT_AGENT || user.role === UserRole.ADMIN
        ? ParticipantRole.SUPPORT_AGENT
        : ParticipantRole.CUSTOMER;

    const participant = await ChatRepository.findParticipant(chatId, userId);
    if (!participant) {
      await ChatRepository.addParticipant(chatId, userId, roleInChat);
      return { success: true, message: "User joined chat successfully" };
    }

    return { success: true, message: "User already in chat" };
  }

  static async createTicket(input: CreateTicketInput) {
    const title = input.title.trim();
    if (!title) throw new Error("Title is required");
    if (title.length > MAX_TITLE_LENGTH) throw new Error("Title is too long");

    const description = input.description?.trim();
    if (description && description.length > MAX_DESCRIPTION_LENGTH)
      throw new Error("Description is too long");

    const user = await AuthRepository.findPublicById(input.customerId);
    if (!user) throw new Error("User not found");
    if (user.role !== UserRole.CUSTOMER)
      throw new Error("User is not a customer");

    return prisma.$transaction(async (tx) => {
      const openChats = await tx.chatConversation.findMany({
        where: {
          customerId: input.customerId,
          status: ConversationStatus.OPEN,
        },
        select: { chatId: true },
      });
      const openChatIds = openChats.map((c) => c.chatId);
      if (openChatIds.length > 0) {
        await tx.ticket.updateMany({
          where: { chatId: { in: openChatIds } },
          data: { ticketStatus: ConversationStatus.CLOSED },
        });
        await tx.chatConversation.updateMany({
          where: { chatId: { in: openChatIds } },
          data: { status: ConversationStatus.CLOSED },
        });
      }

      const chat = await tx.chatConversation.create({
        data: {
          customerId: input.customerId,
          status: ConversationStatus.OPEN,
        },
        select: {
          chatId: true,
        },
      });

      const ticket = await tx.ticket.create({
        data: {
          title,
          description: description || null,
          customerId: input.customerId,
          chatId: chat.chatId,
          ticketStatus: ConversationStatus.OPEN,
        },
        select: {
          ticketId: true,
          title: true,
          description: true,
          chatId: true,
          ticketStatus: true,
          createdAt: true,
        },
      });

      await tx.chatParticipant.create({
        data: {
          chatId: chat.chatId,
          userId: input.customerId,
          roleInChat: ParticipantRole.CUSTOMER,
        },
      });

      if (description) {
        const msg = await tx.chatMessage.create({
          data: {
            chatId: chat.chatId,
            senderId: input.customerId,
            content: description,
          },
          select: {
            messageId: true,
            createdAt: true,
          },
        });
        await tx.chatConversation.update({
          where: { chatId: chat.chatId },
          data: { lastMessageAt: msg.createdAt },
        });
      }
      return { ticket, chatId: chat.chatId };
    });
  }

  static async listUserChats(userId: number, role: UserRole) {
    return ChatRepository.listConversationsForUser(userId, role);
  }

  static async canReadMessages(
    userId: number,
    role: UserRole,
    chatId: number
  ): Promise<boolean> {
    if (role === UserRole.SUPPORT_AGENT || role === UserRole.ADMIN) {
      const chat = await ChatRepository.findConversationById(chatId);
      return !!chat;
    }
    const participant = await ChatRepository.findParticipant(chatId, userId);
    return !!participant;
  }

  static async closeTicketAsAgent(actorId: number, chatId: number) {
    const actor = await AuthRepository.findPublicById(actorId);
    if (!actor) throw new Error("User not found");
    if (
      actor.role !== UserRole.SUPPORT_AGENT &&
      actor.role !== UserRole.ADMIN
    ) {
      throw new Error("Forbidden");
    }
    const chat = await ChatRepository.findConversationById(chatId);
    if (!chat) throw new Error("Chat not found");
    await prisma.$transaction([
      prisma.ticket.updateMany({
        where: { chatId },
        data: { ticketStatus: ConversationStatus.CLOSED },
      }),
      prisma.chatConversation.update({
        where: { chatId },
        data: { status: ConversationStatus.CLOSED },
      }),
    ]);
  }

  static async getTicketByChatId(chatId: number) {
    return ChatRepository.findTicketByChatId(chatId);
  }
}

export default ChatService;
