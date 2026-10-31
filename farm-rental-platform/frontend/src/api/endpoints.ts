import apiClient from './client';
import type {
  PricingUnit,
  MachineCondition,
  BookingStatus,
  RentalTerms,
  MachineCategoryMain,
} from '../types';

// ---------- Auth ----------
export const registerApi = (payload: {
  name: string;
  email: string;
  password: string;
  role: 'user' | 'owner';
  phone?: string;
  village?: string;
  district?: string;
  address?: string;
}) => apiClient.post('/auth/register', payload);

export const loginApi = (payload: { email: string; password: string }) =>
  apiClient.post('/auth/login', payload);

// ---------- Users ----------
export const getProfileApi = () => apiClient.get('/users/profile');

export const updateProfileApi = (formData: FormData) =>
  apiClient.put('/users/profile', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const changePasswordApi = (payload: { currentPassword: string; newPassword: string }) =>
  apiClient.put('/users/change-password', payload);

// ---------- Machines ----------
export interface MachineSearchParams {
  categoryMain?:MachineCategoryMain ;
  categorySub?: string;
  machineType?: string;
  village?: string;
  district?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  availableFrom?: string;
  availableTo?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export const getMachinesApi = (params: MachineSearchParams) =>
  apiClient.get('/machines', { params });

export const getMachineByIdApi = (id: string) => apiClient.get(`/machines/${id}`);

export const getMyMachinesApi = () => apiClient.get('/machines/mine/list');

export const createMachineApi = (formData: FormData) =>
  apiClient.post('/machines', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const updateMachineApi = (id: string, formData: FormData) =>
  apiClient.put(`/machines/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const deleteMachineApi = (id: string) => apiClient.delete(`/machines/${id}`);

export interface MachineFormFields {
  name: string;
  machineType: string;
  categoryMain: MachineCategoryMain;
  categorySub: string;
  brand: string;
  price: number;
  priceUnit: PricingUnit;
  village: string;
  district: string;
  fullAddress?: string;
  condition: MachineCondition;
  description?: string;
}

export const buildMachineFormData = (
  fields: MachineFormFields,
  photos: File[],
  rentalTerms?: Partial<RentalTerms>,
  existingPhotos?: string[]
): FormData => {
  const formData = new FormData();
  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined && value !== null) formData.append(key, String(value));
  });
  photos.forEach((file) => formData.append('photos', file));

// Send the existing photos that the owner wants to keep
if (existingPhotos) {
  formData.append('existingPhotos', JSON.stringify(existingPhotos));
}

// Sent as a single JSON field since the rest of the request is multipart/form-data
// (required for photo uploads) — the backend parses it defensively.
if (rentalTerms) formData.append('rentalTerms', JSON.stringify(rentalTerms));
  return formData;
};

// ---------- Bookings ----------
export const createBookingApi = (payload: {
  machineId: string;
  startDate: string;
  endDate: string;
  notes?: string;
  requestDelivery?: boolean;
  agreementAccepted: boolean;
}) => apiClient.post('/bookings', payload);

export const getBookingsApi = (params?: { status?: BookingStatus; role?: 'user' | 'owner' }) =>
  apiClient.get('/bookings', { params });

export const getBookingByIdApi = (id: string) => apiClient.get(`/bookings/${id}`);

export const updateBookingStatusApi = (id: string, status: BookingStatus) =>
  apiClient.put(`/bookings/${id}`, { status });

export const cancelBookingApi = (id: string) => apiClient.delete(`/bookings/${id}`);

// ---------- Machine Health ----------
export const getMachineHealthApi = (machineId: string) => apiClient.get(`/health/${machineId}`);

export const updateMachineHealthApi = (
  machineId: string,
  payload: {
    lastServiceDate?: string;
    nextMaintenanceDate?: string;
    engineHours?: number;
    fuelUsage?: number;
    mechanicName?: string;
    mechanicMobile?: string;
  }
) => apiClient.put(`/health/${machineId}`, payload);

// ---------- Notifications ----------
export const getNotificationsApi = () => apiClient.get('/notifications');
export const markNotificationReadApi = (id: string) => apiClient.put(`/notifications/${id}/read`);
export const markAllNotificationsReadApi = () => apiClient.put('/notifications/read-all');

// ---------- Terms ----------
export const getPlatformTermsApi = () => apiClient.get('/terms/platform');

// ---------- Dashboards ----------
export const getOwnerDashboardApi = () => apiClient.get('/dashboard/owner');
export const getFarmerDashboardApi = () => apiClient.get('/dashboard/user');
