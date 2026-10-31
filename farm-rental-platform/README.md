# RENTEX - Equipment Rental Platform

A full-stack rental marketplace connecting **users** with **Machine Owners**. user search
and book tractors/equipment by hour, day, or acre; owners list machines, manage bookings, and
track maintenance.

## Tech Stack

- **Frontend:** React + Vite + TypeScript + Tailwind CSS
- **Backend:** Node.js + Express.js
- **Database:** MongoDB + Mongoose
- **Auth:** JWT + bcrypt
- **Images:** Cloudinary (falls back to local disk storage automatically if not configured)
- **Calendar:** react-calendar
- **HTTP client:** Axios

## Folder Structure

```
farm-rental-platform/
├── backend/
│   ├── config/          # db.js, cloudinary.js
│   ├── controllers/     # auth, user, machine, booking, health, notification, dashboard
│   ├── middleware/       # auth (JWT), errorHandler, upload (multer)
│   ├── models/           # User, Machine, Booking, MachineHealth, Notification
│   ├── routes/           # REST route definitions
│   ├── utils/             # generateToken, reminderJob (node-cron)
│   ├── uploads/           # local image storage (used only without Cloudinary)
│   ├── .env.example
│   ├── server.js
│   └── package.json
└── frontend/
    ├── src/
    │   ├── api/            # axios client + endpoint functions
    │   ├── components/     # Navbar, Footer, MachineCard, MachineForm, AvailabilityCalendar, ...
    │   ├── context/         # AuthContext
    │   ├── pages/            # Splash, Login, Register, Home, SearchResults, MachineDetails,
    │   │                      BookingPage, OwnerMachineListing, MachineHealth, OwnerDashboard,
    │   │                      FarmerDashboard, Profile, NotFound
    │   ├── types/             # shared TypeScript interfaces
    │   ├── App.tsx / main.tsx / index.css
    ├── .env.example
    ├── tailwind.config.js
    └── package.json
```

## Prerequisites

- Node.js 18+
- A MongoDB instance (local `mongod`, or a free MongoDB Atlas cluster)

## 1. Backend Setup

```bash
cd backend
cp .env.example .env
# edit .env: set MONGO_URI, JWT_SECRET (and Cloudinary keys if you have them)
npm install
npm run dev        # starts on http://localhost:5000 with nodemon
```

If Cloudinary env vars are left blank, uploaded photos are saved to `backend/uploads/` and served
at `http://localhost:5000/uploads/<filename>` automatically — no extra setup needed for local dev.

## 2. Frontend Setup

```bash
cd frontend
cp .env.example .env
# VITE_API_URL defaults to http://localhost:5000/api — adjust if your backend runs elsewhere
npm install
npm run dev         # starts on http://localhost:5173
```

The Vite dev server proxies `/api` and `/uploads` to `http://localhost:5000`, so the app works
out of the box in development even without setting `VITE_API_URL`.

## 3. Open the app

Visit **http://localhost:5173** — you'll land on the splash screen, then Home. Register as either
a **user** or a **Machine Owner** to get started.

## Core Features Implemented

- JWT auth with protected routes and role-based access (farmer / owner)
- Machine CRUD with photo upload, pricing (hour/day/acre), condition, and location
- Search & filter by machine type, village, district, price range, rating, and availability window
- Live availability calendar per machine; booking creates a reserved slot that **prevents double
  booking** (checked both client- and server-side)
- Booking lifecycle: `pending → approved/rejected` (by owner), `cancelled` (by user),
  `completed`; each transition creates a notification for the other party
- Daily cron job (`node-cron`) that creates **return reminders** the day before a rental ends and
  flags machines with **maintenance due within 7 days**
- Machine health record per machine: last service date, next maintenance date, engine hours, fuel
  usage, mechanic name & mobile — editable by the owner
- Owner dashboard: total machines, active bookings, pending requests, upcoming returns, machine
  health summary
- user dashboard: my bookings, upcoming rentals, booking history
- Profile page: edit details, change password, upload profile photo

## REST API Reference

All protected routes require `Authorization: Bearer <token>`.

| Method | Route | Access | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register (user or owner) |
| POST | `/api/auth/login` | Public | Login |
| GET | `/api/users/profile` | Private | Get logged-in user |
| PUT | `/api/users/profile` | Private | Update profile (+ photo) |
| PUT | `/api/users/change-password` | Private | Change password |
| POST | `/api/machines` | Owner | Create machine listing (+ photos) |
| GET | `/api/machines` | Public | Search/filter machines |
| GET | `/api/machines/mine/list` | Owner | List my machines |
| GET | `/api/machines/:id` | Public | Get machine details |
| PUT | `/api/machines/:id` | Owner | Update machine |
| DELETE | `/api/machines/:id` | Owner | Delete machine |
| POST | `/api/bookings` | user | Create booking request |
| GET | `/api/bookings` | Private | List my bookings |
| GET | `/api/bookings/:id` | Private | Get booking |
| PUT | `/api/bookings/:id` | Private | Update status (approve/reject/cancel/complete) |
| DELETE | `/api/bookings/:id` | user | Cancel booking |
| GET | `/api/health/:machineId` | Private | Get machine health record |
| PUT | `/api/health/:machineId` | Owner | Update machine health record |
| GET | `/api/notifications` | Private | List notifications |
| PUT | `/api/notifications/:id/read` | Private | Mark one as read |
| PUT | `/api/notifications/read-all` | Private | Mark all as read |
| GET | `/api/dashboard/owner` | Owner | Owner dashboard stats |
| GET | `/api/dashboard/farmer` | user | user dashboard stats |

## Notes

- Both frontend and backend have been installed, type-checked, and built successfully in this
  environment (`tsc -b`, `vite build`, and `node --check` on every backend file all pass).
- For production, set `NODE_ENV=production`, a strong `JWT_SECRET`, real Cloudinary credentials,
  and point `CLIENT_URL` / `VITE_API_URL` at your deployed domains.
