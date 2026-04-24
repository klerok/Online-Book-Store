export interface ChatMessage {
    kind: ChatMessageKind
    id: string
    room: ChatRoomName
    author: ChatNickname
    text: string
    createdAt: number
  }
  

export interface ChatEncryptedText {
  iv: string;
  ciphertext: string;
}

export type ChatEncryptedMessage = Omit<ChatMessage, 'text'> & {
    text: ChatEncryptedText
  }