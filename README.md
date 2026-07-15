# Slot Booking

A minimal full-stack slot booking app built with Next.js, TypeScript, Express,
Mongoose, and MongoDB. It keeps limited-capacity slots safe under concurrent
requests and prevents the same user from booking a slot twice.

## Clean-clone setup

Requirements: Node.js 18+, npm, and MongoDB 5+. Docker is optional.

```bash
git clone <repository-url>
cd Slot-Booking-Frontend
npm install
npm --prefix Slot-Booking-Backend install
docker compose up -d
```

Create the environment files:

```bash
cp .env.local.example .env.local
cp Slot-Booking-Backend/.env.example Slot-Booking-Backend/.env
```

The examples are ready for the included Docker database. If using Atlas, replace
`MONGODB_URI` with the Atlas connection string.

Seed the database, then start the API and web app in separate terminals:

```bash
npm run seed
npm run dev:api
```

```bash
npm run dev
```

Open <http://localhost:3000>. By default, the app uses the deployed API at
<https://slot-booking-backend-kubj.onrender.com>. To use a different API, copy
`.env.local.example` to `.env.local` and update `BACKEND_URL`. Browser requests
are sent through the frontend's same-origin `/api` proxy to avoid CORS issues.

## Exactly how double-booking is prevented

`POST /slots/:id/book` uses one atomic guarded update on the slot document:

```ts
Slot.findOneAndUpdate(
  {
    _id: slotId,
    "bookings.userId": { $ne: userId },
    $expr: { $lt: ["$bookedCount", "$capacity"] }
  },
  {
    $inc: { bookedCount: 1 },
    $push: { bookings: { _id: bookingId, userId, createdAt } }
  },
  { new: true }
)
```

MongoDB evaluates the condition and increments the counter as one atomic document
write. If two requests race for the final seat, one update commits first. The
other request's guard no longer matches, so it returns `409 Conflict`; the counter
cannot pass `capacity`. The embedded booking is pushed by that same write, so the
counter and booking record cannot drift. The `bookings.userId` condition also means
two same-millisecond requests from one user can create only one booking.
The frontend also takes a synchronous `useRef` lock and disables the button while
a request is pending, but that is only a UX guard—the database is the authority.

## Trade-off

I embedded the small, capacity-bounded booking list in each slot. That makes the
entire invariant enforceable with one atomic document update and works on standalone
MongoDB. The trade-off is that bookings are not a separate independently scalable
collection; that is acceptable because every slot already has a strict small limit.

## API

- `GET /slots` — all slots with `remainingCapacity` and `isFull`
- `POST /slots/:id/book` with `{ "userId": "your-user-id" }` — `201` on
  success, `409` when full/already booked, `400` for invalid input
- `GET /bookings?userId=your-user-id` — that user's bookings
- `GET /health` — health check

The UI reads slots and bookings exclusively from the API. A user ID must be entered
at runtime; there is no built-in demo user or client-side slot data. Availability
polls every five seconds and refreshes immediately after a booking.

## Verification

Build both applications:

```bash
npm run build:all
```

With the seeded API running, send at least 20 parallel requests at one slot:

```bash
npm run seed
npm run test:concurrency
```

The test exits non-zero unless successful requests exactly fill the remaining
capacity, all other requests return `409`, the counter matches committed bookings,
and final occupancy is at or below capacity. Set `CONCURRENCY_SLOT_ID` in the API
`.env` to target a specific freshly seeded slot; otherwise the first available
slot is used.
