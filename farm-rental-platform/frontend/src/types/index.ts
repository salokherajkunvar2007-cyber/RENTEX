export type Role = 'user' | 'owner';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string;
  village?: string;
  district?: string;
  address?: string;
  profilePhoto?: string;
  rating?: { average: number; count: number };
  createdAt?: string;
}

export type PricingUnit = 'hour' | 'day' | 'acre';
export type MachineCondition = 'excellent' | 'good' | 'fair' | 'needs-service';

export interface AvailabilitySlot {
  _id: string;
  startDate: string;
  endDate: string;
  status: 'booked' | 'blocked';
  booking?: string;
}

export type FuelResponsibility = 'owner' | 'renter' | 'shared';
export type OperatorRequirement = 'not-required' | 'required' | 'optional';
export type CancellationPolicyType = 'flexible' | 'moderate' | 'strict' | 'custom';

export interface CancellationPolicy {
  type: CancellationPolicyType;
  freeCancellationHours: number;
  description: string;
}

export interface RentalTerms {
  minimumRentalDays: number;
  maximumRentalDays: number | null;
  fuelResponsibility: FuelResponsibility;
  operatorRequired: OperatorRequirement;
  deliveryAvailable: boolean;
  deliveryCharge: number;
  pickupRequired: boolean;
  securityDeposit: number;
  cancellationPolicy: CancellationPolicy;
  damagePolicy: string;
  usageRestrictions: string;
  allowedUsage: string;
  customTerms: string[];
  termsVersion: number;
}
export type MachineCategoryMain = 'heavy' | 'household';

export interface MachineCategory {
  main: MachineCategoryMain;
  sub: string;
}
export interface Machine {
  _id: string;
  owner: string | User;
  name: string;
  machineType: string;
  category: MachineCategory;
  brand: string;
  photos: string[];
  pricing: { amount: number; unit: PricingUnit };
  location: {
    village: string;
    district: string;
    fullAddress?: string;
    coordinates: { lat: number | null; lng: number | null };
  };
  condition: MachineCondition;
  description: string;
  availability: AvailabilitySlot[];
  rating: { average: number; count: number };
  isActive: boolean;
  createdAt: string;
  // Optional: machines created before this feature may not have it yet — the
  // backend always returns schema defaults, but keep this optional on the FE
  // in case of partial/legacy data during local development.
  rentalTerms?: RentalTerms;
}

export type BookingStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed';

export interface PriceBreakdown {
  rentalPrice: number;
  deliveryCharge: number;
  securityDeposit: number;
  totalPayable: number;
}

export interface PlatformTermsSection {
  heading: string;
  body: string;
}

export interface PlatformTerms {
  version: number;
  title: string;
  sections: PlatformTermsSection[];
}

export interface BookingAgreement {
  agreementId: string | null;
  platformTermsVersion: number | null;
  ownerTermsVersion: number | null;
  acceptedBy: string | User | null;
  acceptedAt: string | null;
  status: 'not-applicable' | 'accepted';
  platformTermsSnapshot: PlatformTerms | null;
  ownerTermsSnapshot: RentalTerms | null;
  bookingSnapshot: {
    machineName: string;
    machineType: string;
    brand: string;
    ownerName: string;
    ownerPhone?: string;
    renterName: string;
    renterPhone?: string;
    startDate: string;
    endDate: string;
    durationDays: number;
    pricingUnit: PricingUnit;
    rentalPrice: number;
    deliveryCharge: number;
    securityDeposit: number;
    totalPayable: number;
  } | null;
}

export interface TimelineEvent {
  status: string;
  label: string;
  at: string;
}

export interface Booking {
  _id: string;
  machine: Machine | string;
  owner: User | string;
  farmer: User | string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  pricingUnit: PricingUnit;
  status: BookingStatus;
  notes?: string;
  createdAt: string;
  // Optional: bookings created before this feature was added won't have these,
  // and the UI must render sensibly (e.g. "No agreement on file") in that case.
  priceBreakdown?: PriceBreakdown;
  agreement?: BookingAgreement;
  timeline?: TimelineEvent[];
}

export interface MachineHealth {
  _id: string;
  machine: string;
  lastServiceDate: string | null;
  nextMaintenanceDate: string | null;
  engineHours: number;
  fuelUsage: number;
  mechanicName: string;
  mechanicMobile: string;
  status: 'healthy' | 'due-soon' | 'overdue';
}

export interface AppNotification {
  _id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  relatedBooking?: string;
  relatedMachine?: string;
}
