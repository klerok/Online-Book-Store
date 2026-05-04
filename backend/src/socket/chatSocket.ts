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
  MarkReadAck,
  MarkReadPayload,
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
  const peerMax = await ChatService.getPeerMaxLastRead(
    chatId,
    socket.data.userId
  );
  const encryptedHistory: ChatEncryptedMessage[] = history.map((message) =>
    encryptMessage(message, sharedKey, {
      readByPeer:
        message.senderId === socket.data.userId &&
        peerMax !== null &&
        peerMax >= message.messageId,
    })
  );
  socket.emit("chat:history", { chatId, messages: encryptedHistory });
}

async function emitEncryptedMessageToRoom(
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
    const memberUserId = memberData.userId;
    if (!sharedKey || !memberUserId) continue;

    const peerMax = await ChatService.getPeerMaxLastRead(chatId, memberUserId);
    const readByPeer =
      message.senderId === memberUserId &&
      peerMax !== null &&
      peerMax >= message.messageId;

    memberSocket.emit(
      "chat:message",
      encryptMessage(message, sharedKey, { readByPeer })
    );
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

          const readState = await ChatService.markChatFullyReadForUser(
            chatId,
            userId
          );

          const ticket = await ChatService.getTicketByChatId(chatId);

          callback?.({ ok: true, serverPublicKey: handshake.serverPublicKey });

          await emitEncryptedHistory(socket, chatId, handshake.sharedKey);
          socket.emit("chat:ticket", { chatId, ticket });

          socket.to(channelForChat(chatId)).emit("chat:read-receipt", {
            chatId,
            readerId: userId,
            lastReadMessageId: readState?.lastReadMessageId ?? null,
          });
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
          await emitEncryptedMessageToRoom(io, chatId, message);
          callback?.({ ok: true });
        } catch (e) {
          callback?.({
            ok: false,
            error: e instanceof Error ? e.message : "Unknown error",
          });
        }
      }
    );

    socket.on(
      "chat:mark-read",
      async (
        payload: MarkReadPayload,
        callback?: (ack: MarkReadAck) => void
      ) => {
        try {
          const userId = data.userId;
          if (!userId) {
            callback?.({ ok: false, error: "Unauthorized" });
            return;
          }

          const chatId = Number(payload?.chatId);
          const upToMessageId = Number(payload?.upToMessageId);
          if (!Number.isFinite(chatId) || chatId < 1) {
            callback?.({ ok: false, error: "Некорректный чат" });
            return;
          }
          if (!Number.isFinite(upToMessageId) || upToMessageId < 1) {
            callback?.({ ok: false, error: "Некорректное сообщение" });
            return;
          }
          if (data.activeChatId !== chatId) {
            callback?.({
              ok: false,
              error: "Сначала выберите это обращение в списке",
            });
            return;
          }

          const cursor = await ChatService.markReadUpTo(
            chatId,
            userId,
            upToMessageId
          );
          if (cursor != null) {
            io.to(channelForChat(chatId)).emit("chat:read-receipt", {
              chatId,
              readerId: userId,
              lastReadMessageId: cursor,
            });
          }
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
