export interface Slot {
  id: string;
  title: string;
  startTime: string;
  capacity: number;
  bookedCount: number;
  remainingCapacity: number;
  isFull: boolean;
}

export interface SlotsResponse {
  slots: Slot[];
}

export interface ApiMessageResponse {
  message: string;
}

export interface Booking {
  id: string;
  userId: string;
  slot: Slot | null;
  createdAt: string;
}

export interface BookingsResponse {
  bookings: Booking[];
}

export interface BookSlotResponse extends ApiMessageResponse {
  booking: {
    id: string;
    userId: string;
    slot: Slot;
  };
}
