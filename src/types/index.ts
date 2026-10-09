export type AccommodationType = "ROOM" | "COTTAGE" | "VILLA";
export type AccommodationStatus = "AVAILABLE" | "MAINTENANCE";
export type ReservationStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
export type PaymentMethod = "GCASH" | "CREDIT_CARD" | "CASH_ON_ARRIVAL";
export type PaymentStatus = "PAID" | "PENDING" | "FAILED" | "REFUNDED";

export interface AccommodationData {
  id: string;
  name: string;
  type: string;
  pricePerNight: number;
  capacity: number;
  description: string;
  imageUrl: string;
  status: string;
}

export interface AmenityData {
  id: string;
  name: string;
  category: string;
  price: number;
  unit: string;
  description: string;
  imageUrl?: string | null;
}

export interface BookingSubmission {
  accommodationId: string;
  checkInDate: string;
  checkOutDate: string;
  guestCount: number;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  notes?: string;
  selectedAmenities: { amenityId: string; quantity: number }[];
  paymentMethod: PaymentMethod;
  paymentReference?: string;
}

export interface BookingDetail {
  id: string;
  bookingCode: string;
  checkInDate: Date;
  checkOutDate: Date;
  guestCount: number;
  totalAmount: number;
  status: string;
  notes?: string | null;
  createdAt: Date;
  user: {
    name: string;
    email: string;
    phone?: string | null;
  };
  items: {
    id: string;
    quantity: number;
    subtotal: number;
    accommodation?: {
      name: string;
      type: string;
      pricePerNight: number;
      imageUrl: string;
    } | null;
    amenity?: {
      name: string;
      category: string;
      price: number;
      unit: string;
    } | null;
  }[];
  payment?: {
    method: string;
    status: string;
    referenceNumber?: string | null;
    amount: number;
    paidAt?: Date | null;
  } | null;
}
