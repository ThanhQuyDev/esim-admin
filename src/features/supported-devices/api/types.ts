export interface SupportedDevice {
  id: number;
  device: string;
  manufacturer: string;
  type: 'Smart Phones' | 'Smart Watches' | 'Tablets' | 'Laptops';
  createdAt: string;
  updatedAt: string;
}

export interface CreateSupportedDevicePayload {
  device: string;
  manufacturer: string;
  type: 'Smart Phones' | 'Smart Watches' | 'Tablets' | 'Laptops';
}

export interface UpdateSupportedDevicePayload {
  device?: string;
  manufacturer?: string;
  type?: 'Smart Phones' | 'Smart Watches' | 'Tablets' | 'Laptops';
}

export interface SupportedDeviceFilters {
  search?: string;
  type?: string;
}
