/**
 * Per-brand notes on the storefront's supported-devices page (#079).
 *
 * The page could only show one note, hard-coded in the locale file to appear
 * under "iPhone". Rows per brand and language now replace that, several per brand (vande #042).
 */
export type ManufacturerNote = {
  id: string;
  manufacturer: string;
  language: string;
  note: string;
  isActive: boolean;
  /** Position among the brand's notes, lowest first (vande #042). */
  sortOrder?: number;
  createdAt: string;
  updatedAt: string;
};

export type ManufacturerNoteFilters = {
  page?: number;
  limit?: number;
  filters?: string;
  sort?: string;
};

export type ManufacturerNoteResponse = {
  data: ManufacturerNote[];
  hasNextPage: boolean;
  totalCount: number;
};

export type CreateManufacturerNotePayload = {
  manufacturer: string;
  language: string;
  note: string;
  isActive?: boolean;
  sortOrder?: number;
};

export type UpdateManufacturerNotePayload = Partial<CreateManufacturerNotePayload>;
