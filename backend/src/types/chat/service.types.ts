import type { SupportRoomId } from "types/chat/domain.types";

export interface AddUserMessageParams {
  room: SupportRoomId;
  userId: number;
  text: string;
}

export interface JoinRoomParams {
  room: SupportRoomId;
  userId: number;
}
