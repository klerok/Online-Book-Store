import type { Server, Socket } from "socket.io";
import ChatService from "services/chat.service";
import type {
  ChatEncryptedMessage,
  ChatMessage,
  JoinAck,
  JoinPayload,
  SendAck,
  SendPayload,
  SocketData,
} from "types/chat/socket.types";
import {
  createDhServerHandshake,
  decryptText,
  encryptMessage,
} from "./chatCrypto";

function channelForChat(chatId: number) {
  return `chat:${chatId}`;
}

async function emitEncryptedHistory(
  socket: Socket,
  chatId: number,
  sharedKey: Buffer
) {
  const history = await ChatService.getRoomHistory(chatId);
  const encryptedHistory: ChatEncryptedMessage[] = history.map((message) =>
    encryptMessage(message, sharedKey)
  );
  socket.emit("chat:history", { chatId, messages: encryptedHistory });
}

function emitEncryptedMessageToRoom(
  io: Server,
  chatId: number,
  message: ChatMessage
) {
  const room = channelForChat(chatId);
  const memberIds = io.sockets.adapter.rooms.get(room);
  if (!memberIds) return;

  for (const socketId of memberIds) {
    const memberSocket = io.sockets.sockets.get(socketId);
    if (!memberSocket) continue;

    const memberData = memberSocket.data as SocketData;
    const sharedKey = memberData.sharedKey;
    if (!sharedKey) continue;

    memberSocket.emit("chat:message", encryptMessage(message, sharedKey));
  }
}

export function registerChatHandlers(io: Server) {
  io.on("connection", (socket: Socket) => {
    const data = socket.data as SocketData;

    socket.on(
      "chat:join",
      async (payload: JoinPayload, callback?: (ack: JoinAck) => void) => {
        try {
          const userId = data.userId;
          if (!userId) {
            callback?.({ ok: false, error: "Unauthorized" });
            return;
          }

          const chatId = Number(payload?.chatId);
          if (!Number.isFinite(chatId) || chatId < 1) {
            callback?.({ ok: false, error: "Некорректный чат" });
            return;
          }

          const handshake = createDhServerHandshake(payload.clientPublicKey);
          data.sharedKey = handshake.sharedKey;

          await ChatService.joinRoom({ userId, room: chatId });

          const prev = data.activeChatId;
          if (prev != null && prev !== chatId) {
            socket.leave(channelForChat(prev));
          }

          data.activeChatId = chatId;
          socket.join(channelForChat(chatId));

          const ticket = await ChatService.getTicketByChatId(chatId);

          callback?.({ ok: true, serverPublicKey: handshake.serverPublicKey });

          await emitEncryptedHistory(socket, chatId, handshake.sharedKey);
          socket.emit("chat:ticket", { chatId, ticket });
        } catch (e) {
          callback?.({
            ok: false,
            error: e instanceof Error ? e.message : "Unknown error",
          });
        }
      }
    );

    socket.on(
      "chat:message",
      async (payload: SendPayload, callback?: (ack: SendAck) => void) => {
        try {
          if (!data.userId) {
            callback?.({ ok: false, error: "Unauthorized" });
            return;
          }

          const chatId = Number(payload?.chatId);
          if (data.activeChatId !== chatId) {
            callback?.({
              ok: false,
              error: "Сначала выберите это обращение в списке",
            });
            return;
          }

          const sharedKey = data.sharedKey;
          if (!sharedKey) {
            callback?.({ ok: false, error: "Не установлен защищенный канал" });
            return;
          }

          const plainText = decryptText(payload.encrypted, sharedKey);

          const message = await ChatService.addUserMessage({
            room: chatId,
            userId: data.userId,
            text: plainText,
          });
          emitEncryptedMessageToRoom(io, chatId, message);
          callback?.({ ok: true });
        } catch (e) {
          callback?.({
            ok: false,
            error: e instanceof Error ? e.message : "Unknown error",
          });
        }
      }
    );

    socket.on("disconnect", () => {
      const id = data.activeChatId;
      if (id != null) {
        socket.leave(channelForChat(id));
      }
      data.activeChatId = undefined;
      data.sharedKey = undefined;
    });
  });
}
