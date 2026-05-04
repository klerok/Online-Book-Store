export function formatTime(isoOrDate) {
  const d = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
  return d.toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatListDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function conversationTitle(conv) {
  const t = conv.ticket?.title?.trim();
  if (t) return t;
  const u = conv.customer?.username;
  if (u != null && u !== "") return u;
  return `Обращение №${conv.chatId}`;
}

export function normalizeChatsList(raw) {
  if (!Array.isArray(raw)) return [];
  if (raw.length === 0) return [];
  if (raw[0].conversation) {
    return raw.map((row) => ({
      chatId: row.conversation.chatId,
      title: conversationTitle(row.conversation),
      status: row.conversation.status,
      lastMessageAt: row.conversation.lastMessageAt,
      customerUsername: row.conversation.customer?.username ?? null,
    }));
  }
  return raw.map((c) => ({
    chatId: c.chatId,
    title: c.ticket?.title?.trim() || `Обращение №${c.chatId}`,
    status: c.status,
    lastMessageAt: c.lastMessageAt,
    customerUsername: null,
  }));
}

export function mapServerMessage(msg, currentUserId) {
  const mine = msg.senderId === currentUserId;
  return {
    id: `m-${msg.messageId}`,
    messageId: msg.messageId,
    kind: mine ? "user" : "support",
    text: msg.content,
    timeLabel: formatTime(msg.createdAt),
    createdAt: msg.createdAt,
    readByPeer: mine ? !!msg.readByPeer : false,
  };
}

export function systemAcceptedMessage(chatId) {
  return {
    id: `system-${chatId}`,
    kind: "system",
    text: "Обращение принято в обработку.",
    timeLabel: "Система",
  };
}
