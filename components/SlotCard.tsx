import { Slot } from '@/types';

interface SlotCardProps {
  slot: Slot;
  isBooking: boolean;
  isBooked: boolean;
  canBook: boolean;
  onBook: (slotId: string) => void;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString();
}

function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function SlotCard({ slot, isBooking, isBooked, canBook, onBook }: SlotCardProps) {
  const isDisabled = slot.isFull || isBooking || isBooked || !canBook;

  let buttonText = 'Book';
  if (isBooking) {
    buttonText = 'Booking...';
  } else if (isBooked) {
    buttonText = 'Booked';
  } else if (slot.isFull) {
    buttonText = 'Full';
  } else if (!canBook) {
    buttonText = 'Enter user ID to book';
  }

  return (
    <article className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
      <h3 className="mb-3 text-lg font-semibold text-gray-900">
        {slot.title}
      </h3>

      <div className="mb-4 space-y-1 text-sm text-gray-600">
        <p>{formatDate(slot.startTime)}</p>
        <p>{formatTime(slot.startTime)}</p>
      </div>

      <div className="mb-4 space-y-1 text-sm text-gray-700">
        <p>Capacity: {slot.capacity}</p>
        <p>Booked: {slot.bookedCount}</p>
        <p>Remaining: {slot.remainingCapacity}</p>
      </div>

      <div className="mb-4">
        <span
          className={`inline-block px-3 py-1 rounded text-sm font-medium ${
            slot.isFull
              ? 'bg-red-100 text-red-800'
              : 'bg-green-100 text-green-800'
          }`}
        >
          {slot.isFull ? 'Full' : 'Available'}
        </span>
      </div>

      <button
        type="button"
        onClick={() => onBook(slot.id)}
        disabled={isDisabled}
        className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
          isDisabled
            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
        }`}
      >
        {buttonText}
      </button>
    </article>
  );
}
