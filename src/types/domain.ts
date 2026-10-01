export type DamageLevel = "GREEN" | "YELLOW" | "RED";
export type AuctionStatus = "UPCOMING" | "LIVE" | "SOLD" | "UNSOLD";
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
  bidCount?: number;
  startAt: string;
  endAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface Bid {
  id: string;
  vehicleId: string;
  bidderId: string;
  amountCents: number;
  createdAt: string;
}

export interface PublicAuctionState {
  vehicleId: string;
  basePriceCents: number;
  currentBidCents: number | null;
  minimumNextBidCents: number;
  bidCount: number;
  startAt: string;
  endAt: string;
  status: AuctionStatus;
  updatedAt: string;
}

export interface AuctionUserState {
  hasBid: boolean;
  isWinning: boolean;
  lastBidCents: number;
  updatedAt: string;
}

export interface AuctionRecord {
  public: PublicAuctionState;
  private?: {
    leaderUid?: string;
    bids?: Record<string, Bid>;
  };
  userStates?: Record<string, AuctionUserState>;
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
