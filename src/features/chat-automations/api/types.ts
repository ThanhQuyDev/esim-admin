export type ChatAutomationType = 'WELCOME' | 'FIRST_RESPONSE';

export type ChatAutomation = {
  id: number;
  type: ChatAutomationType;
  message: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateChatAutomationDto = {
  type: ChatAutomationType;
  message: string;
  isActive?: boolean;
};

export type UpdateChatAutomationDto = {
  message?: string;
  isActive?: boolean;
};
