export interface SupportedDevice {
  id: number;
  device: string;
  manufacturer: string;
  type: 'Smart Phones' | 'Smart Watches' | 'Tablets' | 'Laptops';
  /** Brand position in the public list; 0 = alphabetical (#090). */
  manufacturerOrder?: number;
  /** Model position inside its brand; 0 = alphabetical (#090). */
  sortOrder?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSupportedDevicePayload {
  device: string;
  manufacturer: string;
  type: 'Smart Phones' | 'Smart Watches' | 'Tablets' | 'Laptops';
  /** Brand position in the public list; 0 = alphabetical (#090). */
  manufacturerOrder?: number;
  /** Model position inside its brand; 0 = alphabetical (#090). */
  sortOrder?: number;
}

export interface UpdateSupportedDevicePayload {
  device?: string;
  manufacturer?: string;
  type?: 'Smart Phones' | 'Smart Watches' | 'Tablets' | 'Laptops';
  manufacturerOrder?: number;
  sortOrder?: number;
}

/** One model on the ordering screen (#047). */
export interface SupportedDeviceOrderingDevice {
  id: string;
  device: string;
  type: SupportedDevice['type'];
  sortOrder: number;
}

/** One brand on the ordering screen, with its models in display order (#047). */
export interface SupportedDeviceBrandOrdering {
  manufacturer: string;
  manufacturerOrder: number;
  devices: SupportedDeviceOrderingDevice[];
}

/** Only the positions that changed; 0 = not numbered. */
export interface SaveSupportedDeviceOrderingPayload {
  manufacturers?: { manufacturer: string; manufacturerOrder: number }[];
  devices?: { id: string; sortOrder: number }[];
}

export interface SupportedDeviceFilters {
  search?: string;
  type?: string;
  limit?: number;
  page?: number;
  sort?: string;
}

export interface SupportedDevicesResponse {
  data: SupportedDevice[];
  totalCount: number;
  hasNextPage: boolean;
}
