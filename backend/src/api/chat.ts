import { asyncHandler } from "@utils/asyncHandler";
import express from "express";
import { UserRole } from "generated/prisma";
import { authMiddleware } from "middleware/auth.middleware";
import AuthRepository from "repositories/auth.repository";
import ChatService from "services/chat.service";
import { getSocketIO } from "socket/ioInstance";
import Send from "@utils/response.utils";
import type { CreateTicketRequestBody } from "types/api/chat.types";


const router = express.Router();

router.use(authMiddleware)

router.get('/', asyncHandler(async (req, res) => {
    const userId = req.user!.userId
    const user = await AuthRepository.findPublicById(userId)
    if (!user) throw new Error('User not found')
    const chats = await ChatService.listUserChats(userId, user!.role)
    res.json({ok: true, data: chats})
}))

router.get(
  "/:chatId/messages",
  asyncHandler(async (req, res) => {
    const chatId = parseInt(req.params.chatId as string, 10);
    const userId = req.user!.userId;
    const user = await AuthRepository.findPublicById(userId);
    if (!user) throw new Error("User not found");
    const allowed = await ChatService.canReadMessages(
      userId,
      user.role,
      chatId
    );
    if (!allowed) throw new Error("Нет доступа к этому чату");
    const [messages, ticket] = await Promise.all([
      ChatService.getRoomHistory(chatId),
      ChatService.getTicketByChatId(chatId),
    ]);
    res.json({
      ok: true,
      data: { messages, ticket },
    });
  })
);

router.post(
  "/:chatId/close",
  asyncHandler(async (req, res) => {
    const chatId = parseInt(req.params.chatId as string, 10);
    const userId = req.user!.userId;
    await ChatService.closeTicketAsAgent(userId, chatId);

    const io = getSocketIO();
    if (io) {
      io.to(`chat:${chatId}`).emit("chat:closed", { chatId });
      io.to("support:agents").emit("chat:closed", { chatId });
    }

    res.json({ ok: true, data: { chatId } });
  })
);

router.post(
  "/tickets",
  asyncHandler(async (req, res) => {
    const userId = req.user!.userId;
    const actor = await AuthRepository.findPublicById(userId);
    if (!actor || actor.role !== UserRole.CUSTOMER) {
      return Send.forbidden(
        res,
        null,
        "Только покупатели могут создавать обращения"
      );
    }
    const { title, description } = req.body as CreateTicketRequestBody;
    const result = await ChatService.createTicket({
      customerId: userId,
      title,
      description: description || null,
    });

    const io = getSocketIO();
    if (io) {
      const customer = await AuthRepository.findPublicById(userId);
      io.to("support:agents").emit("support:ticket-created", {
        chatId: result.chatId,
        title: result.ticket.title,
        status: result.ticket.ticketStatus,
        createdAt: result.ticket.createdAt,
        customerUsername: customer?.username ?? null,
      });
    }

    res.status(201).json({ ok: true, data: result });
  })
);

export default router;
