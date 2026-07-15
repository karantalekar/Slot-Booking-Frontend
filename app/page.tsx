'use client';

import type { FormEvent } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { bookSlot, fetchBookings, fetchSlots } from '@/lib/api';
import { Slot } from '@/types';
import { SlotCard } from '@/components/SlotCard';
import { SlotSkeleton } from '@/components/SlotSkeleton';
import { ErrorState } from '@/components/ErrorState';
import { EmptyState } from '@/components/EmptyState';

const REFRESH_INTERVAL_MS = 5_000;
const VISIBLE_SLOT_LIMIT = 5;

export default function Page() {
  const [userIdInput, setUserIdInput] = useState('');
  const [activeUserId, setActiveUserId] = useState('');
  const [slots, setSlots] = useState<Slot[]>([]);
  const [bookedSlotIds, setBookedSlotIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [notice, setNotice] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const [pendingSlotIds, setPendingSlotIds] = useState<Set<string>>(new Set());
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const bookingLocksRef = useRef<Set<string>>(new Set());

  const loadDashboard = useCallback(async (showLoader = false, signal?: AbortSignal) => {
    try {
      const [nextSlots, bookings] = await Promise.all([
        fetchSlots(signal),
        activeUserId ? fetchBookings(activeUserId, signal) : Promise.resolve([]),
      ]);
      setSlots(nextSlots);
      setBookedSlotIds(new Set(bookings.flatMap((booking) =>
        booking.slot ? [booking.slot.id] : []
      )));
      setLoadError('');
      setLastUpdated(new Date());
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      const message = error instanceof Error ? error.message : 'Unable to load slots';
      if (showLoader) setLoadError(message);
    } finally {
      if (showLoader) setIsLoading(false);
    }
  }, [activeUserId]);

  useEffect(() => {
    const controller = new AbortController();
    const initialLoadId = window.setTimeout(
      () => void loadDashboard(true, controller.signal),
      0
    );
    const intervalId = window.setInterval(
      () => void loadDashboard(false, controller.signal),
      REFRESH_INTERVAL_MS
    );

    return () => {
      controller.abort();
      window.clearTimeout(initialLoadId);
      window.clearInterval(intervalId);
    };
  }, [loadDashboard]);

  const handleUserSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextUserId = userIdInput.trim();

    if (!nextUserId) {
      setNotice({ kind: 'error', text: 'Enter a user ID before booking.' });
      return;
    }

    setActiveUserId(nextUserId);
    setBookedSlotIds(new Set());
    setNotice(null);
  };

  const handleBook = useCallback(async (slotId: string) => {
    if (!activeUserId) {
      setNotice({ kind: 'error', text: 'Enter a user ID before booking.' });
      return;
    }

    if (bookingLocksRef.current.has(slotId)) return;
    bookingLocksRef.current.add(slotId);
    setPendingSlotIds((previous) => new Set(previous).add(slotId));
    setNotice(null);

    try {
      const result = await bookSlot(slotId, activeUserId);
      setSlots((previous) => previous.map((slot) =>
        slot.id === slotId
          ? { ...result.booking.slot, isFull: result.booking.slot.remainingCapacity === 0 }
          : slot
      ));
      setBookedSlotIds((previous) => new Set(previous).add(slotId));
      setNotice({ kind: 'success', text: 'Slot booked successfully.' });
      setLastUpdated(new Date());
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to book the slot';
      setNotice({ kind: 'error', text: message });
      void loadDashboard(false);
    } finally {
      bookingLocksRef.current.delete(slotId);
      setPendingSlotIds((previous) => {
        const next = new Set(previous);
        next.delete(slotId);
        return next;
      });
    }
  }, [activeUserId, loadDashboard]);

  const visibleSlots = useMemo(
    () => slots.slice(0, VISIBLE_SLOT_LIMIT),
    [slots]
  );
  const availableCount = useMemo(
    () => visibleSlots.filter((slot) => !slot.isFull).length,
    [visibleSlots]
  );

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Slot Booking</h1>
            <p className="mt-2 text-gray-600">
              {availableCount} {availableCount === 1 ? 'slot' : 'slots'} currently available
            </p>
            {activeUserId && (
              <p className="mt-2 text-sm font-medium text-gray-700">
                Booking as: <span className="font-mono">{activeUserId}</span>
              </p>
            )}
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <span>{lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : 'Updating...'}</span>
            <button
              type="button"
              onClick={() => void loadDashboard(false)}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Refresh
            </button>
          </div>
        </header>

        <form
          onSubmit={handleUserSubmit}
          className="mb-6 flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 sm:flex-row sm:items-end"
        >
          <label className="flex-1 text-sm font-medium text-gray-700">
            User ID
            <input
              type="text"
              value={userIdInput}
              onChange={(event) => setUserIdInput(event.target.value)}
              maxLength={100}
              placeholder="Enter your user ID"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </label>
          <button
            type="submit"
            className="rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Use user ID
          </button>
        </form>

        {notice && (
          <div
            role={notice.kind === 'error' ? 'alert' : 'status'}
            className={`mb-6 rounded-lg border p-4 ${
              notice.kind === 'success'
                ? 'border-green-200 bg-green-50 text-green-800'
                : 'border-red-200 bg-red-50 text-red-800'
            }`}
          >
            {notice.text}
          </div>
        )}

        {loadError && !isLoading && (
          <div className="mb-6">
            <ErrorState
              message={loadError}
              onRetry={() => {
                setIsLoading(true);
                void loadDashboard(true);
              }}
            />
          </div>
        )}

        {isLoading && <SlotSkeleton />}
        {!isLoading && !loadError && slots.length === 0 && <EmptyState />}
        {!isLoading && visibleSlots.length > 0 && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {visibleSlots.map((slot) => (
              <SlotCard
                key={slot.id}
                slot={slot}
                isBooking={pendingSlotIds.has(slot.id)}
                isBooked={bookedSlotIds.has(slot.id)}
                canBook={Boolean(activeUserId)}
                onBook={handleBook}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
