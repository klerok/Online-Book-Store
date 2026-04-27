import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { closeChat, createTicket, fetchChats } from "../api/chat";
import { useSupportChatSocket } from "./useSupportChatSocket";
import {
  mapServerMessage,
  normalizeChatsList,
  systemAcceptedMessage,
} from "../pages/Support/supportUtils";

function isStaffRole(role) {
  return role === "SUPPORT_AGENT" || role === "ADMIN";
}

function chatRowFromSocketPayload(payload) {
  return {
    chatId: payload.chatId,
    title: payload.title?.trim() || `Обращение №${payload.chatId}`,
    status: payload.status ?? "OPEN",
    lastMessageAt: payload.createdAt ?? new Date().toISOString(),
    customerUsername: payload.customerUsername ?? null,
  };
}

export function useSupportDesk(user) {
  const userRef = useRef(user);
  userRef.current = user;

  const selectedChatIdRef = useRef(null);
  const prependForChatIdRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const clearOpenChatRef = useRef(() => {});

  const [chats, setChats] = useState([]);
  const [chatsLoading, setChatsLoading] = useState(false);
  const [chatsError, setChatsError] = useState(null);

  const [selectedChatId, setSelectedChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [draft, setDraft] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [ticketTitle, setTicketTitle] = useState("");
  const [ticketDescription, setTicketDescription] = useState("");
  const [ticketSubmitting, setTicketSubmitting] = useState(false);
  const [ticketError, setTicketError] = useState(null);

  const [activeTicket, setActiveTicket] = useState(null);
  const [closeSubmitting, setCloseSubmitting] = useState(false);

  selectedChatIdRef.current = selectedChatId;

  clearOpenChatRef.current = () => {
    setSelectedChatId(null);
    setMessages([]);
    setActiveTicket(null);
  };

  const socketHandlers = useMemo(
    () => ({
      onChatHistory: ({ chatId, messages: historyMsgs }) => {
        const u = userRef.current;
        if (!u || chatId !== selectedChatIdRef.current) return;
        const mapped = (historyMsgs ?? []).map((m) =>
          mapServerMessage(m, u.userId)
        );
        const prepend = prependForChatIdRef.current === chatId;
        if (prepend) prependForChatIdRef.current = null;
        setMessages(
          prepend ? [systemAcceptedMessage(chatId), ...mapped] : mapped
        );
        setMessagesLoading(false);
      },
      onChatTicket: ({ chatId, ticket }) => {
        if (chatId !== selectedChatIdRef.current) return;
        setActiveTicket(ticket ?? null);
      },
      onChatMessage: (payload) => {
        const u = userRef.current;
        if (!u || !payload || payload.chatId !== selectedChatIdRef.current) {
          return;
        }
        setMessages((prev) => {
          if (prev.some((m) => m.id === `m-${payload.messageId}`)) return prev;
          return [...prev, mapServerMessage(payload, u.userId)];
        });
      },
      onTicketCreated: (payload) => {
        if (!isStaffRole(userRef.current?.role) || !payload?.chatId) return;
        setChats((prev) => {
          if (prev.some((c) => c.chatId === payload.chatId)) return prev;
          return [chatRowFromSocketPayload(payload), ...prev];
        });
      },
      onChatClosed: (payload) => {
        const id = payload?.chatId;
        if (id == null) return;
        if (isStaffRole(userRef.current?.role)) {
          setChats((prev) => prev.filter((c) => c.chatId !== id));
          if (selectedChatIdRef.current === id) clearOpenChatRef.current();
        } else {
          setChats((prev) =>
            prev.map((c) => (c.chatId === id ? { ...c, status: "CLOSED" } : c))
          );
        }
      },
    }),
    []
  );

  const {
    status: socketStatus,
    joinChat,
    sendMessage: socketSendMessage,
  } = useSupportChatSocket({ enabled: !!user, handlers: socketHandlers });

  const socketConnected = socketStatus === "connected";
  const isAgent = isStaffRole(user?.role);
  const canCreateTicket = !isAgent;

  useEffect(() => {
    if (isAgent && modalOpen) {
      setModalOpen(false);
      setTicketTitle("");
      setTicketDescription("");
      setTicketError(null);
    }
  }, [isAgent, modalOpen]);

  useEffect(() => {
    if (!user) return undefined;

    let cancelled = false;
    (async () => {
      setChatsLoading(true);
      setChatsError(null);
      try {
        const json = await fetchChats();
        if (!cancelled) setChats(normalizeChatsList(json.data));
      } catch (e) {
        if (!cancelled) {
          setChatsError(
            e instanceof Error ? e.message : "Не удалось загрузить чаты"
          );
          setChats([]);
        }
      } finally {
        if (!cancelled) setChatsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const openChat = useCallback((chatId, options = {}) => {
    prependForChatIdRef.current = options.prependSystem ? chatId : null;
    setSelectedChatId(chatId);
  }, []);

  useEffect(() => {
    const id = selectedChatId;
    if (id == null) {
      setMessagesLoading(false);
      return undefined;
    }
    if (!socketConnected) {
      setMessagesLoading(true);
      return undefined;
    }

    let cancelled = false;
    (async () => {
      setMessagesLoading(true);
      setMessages([]);
      setActiveTicket(null);
      try {
        await joinChat(id);
        if (cancelled) return;
      } catch (e) {
        if (!cancelled) {
          console.warn(e);
          setMessages([]);
          setActiveTicket(null);
        }
      } finally {
        if (!cancelled) setMessagesLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedChatId, socketConnected, joinChat]);

  const handleCloseTicket = useCallback(async () => {
    if (!selectedChatId || !isAgent || closeSubmitting) return;
    setCloseSubmitting(true);
    try {
      await closeChat(selectedChatId);
      setChats((prev) => prev.filter((c) => c.chatId !== selectedChatId));
      clearOpenChatRef.current();
    } catch (err) {
      console.error(err);
    } finally {
      setCloseSubmitting(false);
    }
  }, [selectedChatId, isAgent, closeSubmitting]);

  const handleSend = useCallback(
    (e) => {
      e.preventDefault();
      const text = draft.trim();
      if (!text || !selectedChatId || !socketConnected) return;
      socketSendMessage(selectedChatId, text);
      setDraft("");
    },
    [draft, selectedChatId, socketConnected, socketSendMessage]
  );

  const handleCreateTicket = useCallback(
    async (e) => {
      e.preventDefault();
      setTicketError(null);
      const title = ticketTitle.trim();
      if (!title) {
        setTicketError("Укажите заголовок");
        return;
      }
      setTicketSubmitting(true);
      try {
        const json = await createTicket({
          title,
          description: ticketDescription.trim() || null,
        });
        const { chatId, ticket } = json.data;
        setModalOpen(false);
        setTicketTitle("");
        setTicketDescription("");

        const entry = {
          chatId,
          title: ticket?.title ?? `Обращение №${chatId}`,
          status: ticket?.ticketStatus ?? "OPEN",
          lastMessageAt: ticket?.createdAt ?? new Date().toISOString(),
          customerUsername: null,
        };
        setChats((prev) => {
          const rest = prev.filter((c) => c.chatId !== chatId);
          return [entry, ...rest];
        });
        openChat(chatId, { prependSystem: true });
      } catch (err) {
        setTicketError(
          err instanceof Error ? err.message : "Не удалось создать обращение"
        );
      } finally {
        setTicketSubmitting(false);
      }
    },
    [ticketTitle, ticketDescription, openChat]
  );

  const openCreateTicketModal = useCallback(() => {
    setTicketError(null);
    setModalOpen(true);
  }, []);

  const selectedChat = chats.find((c) => c.chatId === selectedChatId);
  const chatIsOpen = selectedChat?.status === "OPEN";
  const ticketDescriptionText = activeTicket?.description?.trim() ?? "";
  const composerDisabled = !socketConnected || !chatIsOpen;

  return {
    chats,
    chatsLoading,
    chatsError,
    selectedChatId,
    openChat,
    messages,
    messagesLoading,
    messagesContainerRef,
    draft,
    setDraft,
    socketConnected,
    modalOpen,
    setModalOpen,
    ticketTitle,
    setTicketTitle,
    ticketDescription,
    setTicketDescription,
    ticketSubmitting,
    ticketError,
    closeSubmitting,
    isAgent,
    canCreateTicket,
    handleCloseTicket,
    handleSend,
    handleCreateTicket,
    openCreateTicketModal,
    selectedChat,
    chatIsOpen,
    ticketDescriptionText,
    composerDisabled,
  };
}
