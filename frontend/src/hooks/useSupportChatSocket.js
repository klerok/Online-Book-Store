import { useCallback, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { SOCKET_URL } from "../api/chat";
import {
  createDhClientHandshake,
  createSharedKeyFromServerPublicKey,
  decryptText,
  encryptText,
} from "../chat/chatCrypto";

const CHAT_EVENTS = [
  ["chat:ticket", "onChatTicket"],
  ["support:ticket-created", "onTicketCreated"],
  ["chat:closed", "onChatClosed"],
];

export function useSupportChatSocket({ enabled, handlers = {} }) {
  const socketRef = useRef(null);
  const sharedKeyRef = useRef(null);
  const activeChatIdRef = useRef(null);
  const pendingHistoryRef = useRef(null);
  const pendingMessagesRef = useRef([]);
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  const [status, setStatus] = useState("disconnected");

  const decryptHistoryPayload = useCallback(async (payload, sharedKey) => {
    const encryptedMessages = Array.isArray(payload?.messages)
      ? payload.messages
      : [];
    const decryptedMessages = await Promise.all(
      encryptedMessages.map(async (msg) => ({
        ...msg,
        content: await decryptText(msg.content, sharedKey),
      }))
    );
    handlersRef.current.onChatHistory?.({
      chatId: payload.chatId,
      messages: decryptedMessages,
    });
  }, []);

  const decryptMessagePayload = useCallback(async (payload, sharedKey) => {
    const decrypted = {
      ...payload,
      content: await decryptText(payload.content, sharedKey),
    };
    handlersRef.current.onChatMessage?.(decrypted);
  }, []);

  const flushPendingEncryptedEvents = useCallback(async () => {
    const sharedKey = sharedKeyRef.current;
    const activeChatId = activeChatIdRef.current;
    if (!sharedKey || !activeChatId) return;

    const pendingHistory = pendingHistoryRef.current;
    if (pendingHistory && pendingHistory.chatId === activeChatId) {
      await decryptHistoryPayload(pendingHistory, sharedKey);
    }
    pendingHistoryRef.current = null;

    const pendingMessages = pendingMessagesRef.current;
    if (pendingMessages.length > 0) {
      const forActiveChat = pendingMessages.filter(
        (msg) => msg?.chatId === activeChatId
      );
      for (const payload of forActiveChat) {
        await decryptMessagePayload(payload, sharedKey);
      }
    }
    pendingMessagesRef.current = [];
  }, [decryptHistoryPayload, decryptMessagePayload]);

  useEffect(() => {
    if (!enabled) return;

    const socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;
    sharedKeyRef.current = null;
    activeChatIdRef.current = null;
    pendingHistoryRef.current = null;
    pendingMessagesRef.current = [];
    setStatus("connecting");

    socket.on("connect", () => setStatus("connected"));

    socket.on("disconnect", () => {
      sharedKeyRef.current = null;
      activeChatIdRef.current = null;
      pendingHistoryRef.current = null;
      pendingMessagesRef.current = [];
      setStatus("disconnected");
    });
    socket.on("connect_error", () => setStatus("error"));

    socket.on("chat:history", async (payload) => {
      try {
        if (payload?.chatId !== activeChatIdRef.current) return;

        const sharedKey = sharedKeyRef.current;
        if (!sharedKey) {
          pendingHistoryRef.current = payload;
          return;
        }

        await decryptHistoryPayload(payload, sharedKey);
      } catch (e) {
        console.error("chat:history", e);
      }
    });

    socket.on("chat:message", async (payload) => {
      try {
        if (payload?.chatId !== activeChatIdRef.current) return;

        const sharedKey = sharedKeyRef.current;
        if (!sharedKey) {
          pendingMessagesRef.current.push(payload);
          return;
        }

        await decryptMessagePayload(payload, sharedKey);
      } catch (e) {
        console.error("chat:message", e);
      }
    });

    for (const [event, key] of CHAT_EVENTS) {
      socket.on(event, (payload) => handlersRef.current[key]?.(payload));
    }

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
      sharedKeyRef.current = null;
      activeChatIdRef.current = null;
      pendingHistoryRef.current = null;
      pendingMessagesRef.current = [];
      setStatus("disconnected");
    };
  }, [enabled, decryptHistoryPayload, decryptMessagePayload]);

  const joinChat = useCallback(
    async (chatId) => {
      const socket = socketRef.current;
      if (!socket?.connected) throw new Error("Нет соединения с чатом");

      sharedKeyRef.current = null;
      activeChatIdRef.current = chatId;
      pendingHistoryRef.current = null;
      pendingMessagesRef.current = [];

      const { privateKey, publicKey } = createDhClientHandshake();

      const ack = await new Promise((resolve, reject) => {
        socket.emit(
          "chat:join",
          { chatId, clientPublicKey: publicKey },
          (joinAck) => {
            if (joinAck?.ok) resolve(joinAck);
            else reject(new Error(joinAck?.error || "Не удалось войти в чат"));
          }
        );
      });

      const sharedKey = await createSharedKeyFromServerPublicKey(
        ack.serverPublicKey,
        privateKey
      );
      sharedKeyRef.current = sharedKey;

      await flushPendingEncryptedEvents();
    },
    [flushPendingEncryptedEvents]
  );

  const sendMessage = useCallback(async (chatId, content) => {
    const socket = socketRef.current;
    const sharedKey = sharedKeyRef.current;
    if (!socket?.connected || !sharedKey) return;
    const encrypted = await encryptText(content, sharedKey);
    socket.emit("chat:message", { chatId, encrypted }, (ack) => {
      if (ack && !ack.ok) console.error("chat:message", ack.error);
    });
  }, []);

  return { status, joinChat, sendMessage };
}
