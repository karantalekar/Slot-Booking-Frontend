import {
  BookingsResponse,
  BookSlotResponse,
  Slot,
  SlotsResponse,
} from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000';

async function readJson<T>(response: Response): Promise<T> {
  const data = (await response.json().catch(() => null)) as T | null;

  if (!response.ok) {
    const message =
      data && typeof data === 'object' && 'message' in data
        ? String(data.message)
        : `Request failed (${response.status})`;
    throw new Error(message);
  }

  if (!data) {
    throw new Error('The API returned an empty response');
  }

  return data;
}

export async function fetchSlots(signal?: AbortSignal): Promise<Slot[]> {
  const response = await fetch(`${API_URL}/slots`, { cache: 'no-store', signal });

  if (!response.ok) {
    throw new Error('Unable to load slots');
  }

  const data: SlotsResponse = await response.json();
  return data.slots;
}

export async function bookSlot(
  slotId: string,
  userId: string
): Promise<BookSlotResponse> {
  const response = await fetch(`${API_URL}/slots/${slotId}/book`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId }),
  });

  return readJson<BookSlotResponse>(response);
}

export async function fetchBookings(
  userId: string,
  signal?: AbortSignal
): Promise<BookingsResponse['bookings']> {
  const response = await fetch(
    `${API_URL}/bookings?userId=${encodeURIComponent(userId)}`,
    { cache: 'no-store', signal }
  );
  const data = await readJson<BookingsResponse>(response);
  return data.bookings;
}
