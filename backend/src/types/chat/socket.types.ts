export type SocketData = {
  userId?: number;
  activeChatId?: number;
  sharedKey?: Buffer;
};

export type JoinPayload = {
  chatId: number;
  clientPublicKey: string;
};

export type SendPayload = {
  chatId: number;
  encrypted: ChatEncryptedText;
};

export type JoinAck =
  | { ok: true; serverPublicKey: string }
  | { ok: false; error: string };
export type SendAck = { ok: true } | { ok: false; error: string };

export interface ChatMessage {
  messageId: number;
  chatId: number;
  senderId: number;
  content: string;
  createdAt: Date | string;
}

export interface ChatEncryptedText {
  iv: string;
  ciphertext: string;
}

export type ChatEncryptedMessage = Omit<ChatMessage, "content"> & {
  content: ChatEncryptedText;
};
