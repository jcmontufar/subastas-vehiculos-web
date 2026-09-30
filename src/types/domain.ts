export type DamageLevel = "GREEN" | "YELLOW" | "RED";
export type AuctionStatus = "PENDING" | "ACTIVE" | "ENDED";
export type Drivetrain = "AWD" | "FWD" | "RWD" | "4WD";

export interface UserProfile {
  uid: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  createdAt: string;
}

export interface VehicleImage {
  id: string;
  url: string;
  storagePath: string;
  order: number;
}

export interface Vehicle {
  id: string;
  ownerId: string;
  year: number;
  itemType: string;
  brand: string;
  model: string;
  engine: string;
  transmission: string;
  fuelType: string;
  drivetrain: Drivetrain;
  cylinders: number;
  damageLevel: DamageLevel;
  images: VehicleImage[];
  basePrice: number;
  currentBid?: number;
  startAt: string;
  endAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface Bid {
  id: string;
  vehicleId: string;
  bidderId: string;
  anonymousBidderLabel: string;
  amount: number;
  createdAt: string;
}

export interface VehicleFiltersValue {
  year: string;
  brand: string;
  model: string;
  fuelType: string;
  transmission: string;
  drivetrain: string;
  damageLevel: string;
}
