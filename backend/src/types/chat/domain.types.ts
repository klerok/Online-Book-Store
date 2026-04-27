export type SupportRoomId = number;


export interface CreateTicketInput {
  customerId: number;
  title: string;
  description: string | null;
}
