export type ProfitMargin = {
  id: number;
  name: string;
  percentage: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type SaveProfitMarginPayload = {
  name: string;
  percentage: number;
  isActive: boolean;
};
