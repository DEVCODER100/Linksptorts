# LinkSports — India's Sports Networking Platform

React + Node.js + MongoDB - linksports.in

## Quick Start

### Option A — Double-click
Run `start.bat` to launch both frontend and backend in separate windows.

### Option B — Manual
```bash
# Terminal 1 — Backend
cd backend
npm run dev
# Runs on http://localhost:5000

# Terminal 2 — Frontend
cd frontend
npm run dev
# Runs on http://localhost:3000
```

## Migrate Existing Data from MySQL


   ```

2. Run migration:
   ```bash
   cd backend
   npm run migrate
   ```
   This migrates all players → AthleteProfile, coaches → CoachProfile, pro_accounts → Organization.

## Environment Variables

### Backend (`backend/.env`)
| Variable | Description |
|---|---|
| `MONGODB_URI` | MongoDB Atlas connection string (already set) |
| `JWT_SECRET` | JWT signing secret |
| `RAZORPAY_KEY_ID/SECRET` | Razorpay payment keys |
| `GOOGLE_CLIENT_ID/SECRET` | Google OAuth keys |
| `EMAIL_HOST/USER/PASS` | SMTP for emails |
| `MYSQL_*` | Only needed for migration |

### Frontend (`frontend/.env.local`)
| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API URL (default: http://localhost:5000/api/v1) |
| `NEXT_PUBLIC_SOCKET_URL` | Socket.IO URL (default: http://localhost:5000) |

## Pages

| Route | Description |
|---|---|
| `/` | Landing page |
| `/auth/login` | Login |
| `/auth/register` | Register (athlete/coach/org/professional) |
| `/auth/verify-email` | Email OTP verification |
| `/dashboard` | Role-aware dashboard |
| `/search` | Search athletes, coaches, organizations |
| `/listings` | Browse trials/events/tournaments |
| `/listings/[id]` | Listing detail + apply |
| `/jobs` | Job board |
| `/messages` | Real-time chat |
| `/connections` | Network / connection requests |
| `/notifications` | Notifications |
| `/athlete/[id]` | Athlete profile |
| `/coach/[id]` | Coach profile |
| `/org/[id]` | Organization profile |
| `/profile/edit` | Edit your profile |
| `/org/listings/create` | Create listing (org only) |
| `/org/jobs/create` | Create job (org only) |
| `/admin` | Admin dashboard (admin only) |

## Tech Stack
- **Frontend**: Next.js 14, React 18, TypeScript, TailwindCSS, Zustand, React Query
- **Backend**: Node.js, Express, TypeScript, Socket.IO
- **Database**: MongoDB Atlas via Mongoose
- **Auth**: JWT (RS256) + Google OAuth + Email OTP
- **Payments**: Razorpay (with mock fallback)
