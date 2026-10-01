/**
 * Per-brand notes on the storefront's supported-devices page (#079).
 *
 * The page could only show one note, hard-coded in the locale file to appear
 * under "iPhone". One row per brand per language now replaces that.
 */
export type ManufacturerNote = {
  id: string;
  manufacturer: string;
  language: string;
  note: string;
  isActive: boolean;
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
};

export type UpdateManufacturerNotePayload = Partial<CreateManufacturerNotePayload>;
