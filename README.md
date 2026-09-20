# SnapGallery

> A full-stack photo sharing and client proofing platform for photography studios.
> Admins create events, team members upload photos, clients view galleries via a secure PIN.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Project Structure](#project-structure)
- [Local Setup](#local-setup)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Deployment](#deployment)
- [Security](#security)
- [Author](#author)

---

## Overview

SnapGallery is built for photography teams that need a structured workflow from event shoot to client delivery.

| Role | What they can do |
|---|---|
| **Admin** | Create events, assign photographers, upload cover images, select photos, publish PIN-protected galleries |
| **Team Member** | View assigned events, upload photos, track their uploads |
| **Customer** | Open the gallery link, enter the PIN, browse and download photos — no account needed |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite 5, React Router 6 |
| Styling | Custom CSS with design tokens, DM Serif Display + DM Sans fonts |
| State / HTTP | React Context API, Axios |
| Backend | Node.js 18+, Express 4 |
| Database | MongoDB Atlas, Mongoose 8 |
| File Storage | Cloudinary CDN |
| Auth | JWT + bcryptjs (12 rounds) |
| OAuth | Passport.js + Google OAuth 2.0 (admin only) |
| Security | Helmet, express-rate-limit, CORS |
| Deployment | Render (backend), Vercel (frontend) |

---

## Features

### Admin
- Register and sign in (email/password or Google)
- Create events with name, date, description, and cover image
- Add and remove team members from events
- View all photos uploaded by the team
- Select photos for the client gallery
- Set a gallery title and access PIN
- Publish gallery and share the link + PIN with the client
- Unpublish or update galleries at any time

### Team Member
- Account created by Admin — sign in with provided credentials
- View only assigned events
- Upload photos (up to 20 at a time, max 20 MB each)
- View only their own uploads
- Cannot publish galleries or access admin features

### Customer
- No account required
- Open the gallery link shared by the photographer
- Enter the PIN to unlock the gallery
- Browse and download selected photos
- Can also enter PIN directly from the login page

---

## Project Structure

```
snapgallery/
├── backend/
│   ├── src/
│   │   ├── config/          # Cloudinary, database, passport, mailer
│   │   ├── middleware/       # authenticate, authorize, validate
│   │   ├── models/          # User, Event, Photo, Gallery
│   │   ├── routes/          # auth, events, photos, galleries
│   │   └── server.js
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── public/
│   │   ├── cameras/         # Scrolling login page images
│   │   └── icons/           # Role tab icons (admin, team, customer)
│   ├── src/
│   │   ├── api/             # Axios helpers per resource
│   │   ├── components/      # Sidebar, Topbar, Modal, Toast, Upload, Spinner
│   │   ├── context/         # AuthContext
│   │   ├── pages/
│   │   │   ├── admin/       # Dashboard, Events, Photos, Gallery, Team, Settings
│   │   │   ├── team/        # Dashboard, Events, Photos, Upload, Profile
│   │   │   ├── LoginPage, RegisterPage, GalleryPage, NotFoundPage
│   │   └── index.css        # Full design system
│   ├── .env.example
│   ├── vercel.json
│   └── vite.config.js
│
├── render.yaml
├── .gitignore
└── README.md
```

---

## Local Setup

### Prerequisites

- Node.js ≥ 18
- npm ≥ 9
- [MongoDB Atlas](https://www.mongodb.com/atlas) free cluster
- [Cloudinary](https://cloudinary.com) free account

### 1 — Clone the repo

```bash
git clone https://github.com/Pranaypatil43/snapgallery.git
cd snapgallery
```

### 2 — Backend

```bash
cd backend
npm install
cp .env.example .env
# Fill in your values in .env (see Environment Variables section below)
npm run dev
# Runs on http://localhost:5000
```

### 3 — Frontend

```bash
cd frontend
npm install
cp .env.example .env
# Set VITE_API_URL=http://localhost:5000/api
npm run dev
# Runs on http://localhost:5173
```

Open `http://localhost:5173` in your browser.

> **First registered user automatically becomes Admin.**
> All subsequent registrations are Team Members (or use the Admin invite flow).

---

## Environment Variables

### Backend — `backend/.env`

```env
PORT=5000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/snapgallery

# JWT
JWT_SECRET=your_64_char_random_secret
JWT_EXPIRES_IN=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# CORS & URLs
ALLOWED_ORIGINS=http://localhost:5173
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:5000

# Session (for Google OAuth handshake)
SESSION_SECRET=your_32_char_random_secret

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Email (optional)
EMAIL_USER=you@gmail.com
EMAIL_PASS=your_16_char_app_password
```

### Frontend — `frontend/.env`

```env
VITE_API_URL=http://localhost:5000/api
```

> ⚠️ Never commit `.env` files. They are listed in `.gitignore`.
> Use `.env.example` files as templates.

---

## API Reference

All authenticated routes require `Authorization: Bearer <token>` header.

### Auth

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | None | Register first user as Admin |
| POST | `/api/auth/login` | None | Login, returns JWT |
| POST | `/api/auth/invite` | Admin | Create a team member account |
| GET | `/api/auth/me` | Any | Get current user profile |
| PATCH | `/api/auth/change-password` | Any | Change own password |
| GET | `/api/auth/google` | None | Start Google OAuth (admin) |
| GET | `/api/auth/google/callback` | None | Google OAuth callback |

### Events

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/events` | Admin | Create event |
| GET | `/api/events` | Any | List events (scoped by role) |
| GET | `/api/events/:id` | Owner / Member | Get single event |
| POST | `/api/events/:id/cover` | Admin | Upload cover image |
| POST | `/api/events/:id/members` | Admin | Add team members |
| DELETE | `/api/events/:id/members/:memberId` | Admin | Remove team member |
| GET | `/api/events/users/team-members` | Admin | List all team members |

### Photos

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/photos/:eventId` | Owner / Member | Upload photos (up to 20) |
| GET | `/api/photos/event/:eventId` | Owner / Member | List photos (admin: all, team: own) |
| DELETE | `/api/photos/:photoId` | Owner / Admin | Delete photo |

### Galleries

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/galleries` | Admin | Create / update gallery |
| PATCH | `/api/galleries/:id/publish` | Admin | Publish gallery |
| PATCH | `/api/galleries/:id/unpublish` | Admin | Unpublish gallery |
| GET | `/api/galleries/admin` | Admin | List all admin's galleries |
| GET | `/api/galleries/event/:eventId` | Admin | Get gallery for an event |
| POST | `/api/galleries/public/access` | None | Find gallery by PIN only |
| GET | `/api/galleries/public/:slug` | None | Get gallery info (no photos) |
| POST | `/api/galleries/public/:slug/verify` | None | Verify PIN and get photos |

---

## Deployment

### Backend → Render

1. Go to [dashboard.render.com](https://dashboard.render.com) → **New Web Service**
2. Connect your GitHub repo
3. Settings:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `node src/server.js`
   - **Health Check Path:** `/health`
4. Add all environment variables from `backend/.env.example`
5. Set `ALLOWED_ORIGINS` and `FRONTEND_URL` to your Vercel frontend URL
6. Set `NODE_ENV=production`

> A `render.yaml` blueprint is included in the root — you can also use **Render Blueprints** for one-click deployment.

### Frontend → Vercel

1. Go to [vercel.com](https://vercel.com) → **New Project**
2. Import your GitHub repo
3. Settings:
   - **Root Directory:** `frontend`
   - **Framework:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Add environment variable:
   - `VITE_API_URL` = `https://your-render-api.onrender.com/api`
5. Deploy

> A `vercel.json` is included in `frontend/` that handles SPA routing rewrites automatically.

### After Deploying Both

Update your backend environment variables on Render:
```
ALLOWED_ORIGINS=https://your-app.vercel.app
FRONTEND_URL=https://your-app.vercel.app
```

Update Google OAuth console (if using Google sign-in):
- Authorised JavaScript origins: `https://your-app.vercel.app`
- Authorised redirect URI: `https://your-render-api.onrender.com/api/auth/google/callback`

---

## Security

| Measure | Implementation |
|---|---|
| Password hashing | bcrypt, 12 salt rounds |
| PIN hashing | bcrypt, 12 salt rounds, `select: false` in schema |
| JWT | Signed with `JWT_SECRET`, 7-day expiry |
| Role enforcement | `authorize()` middleware on every sensitive route |
| CORS | Restricted to `ALLOWED_ORIGINS` env var |
| HTTP headers | `helmet()` — sets CSP, HSTS, X-Frame-Options etc. |
| Rate limiting | 20 req / 15 min on auth routes, 10 req / 15 min on PIN routes |
| Secure session | `httpOnly: true`, `secure: true` in production |
| Input validation | `express-validator` on all POST/PATCH endpoints |
| File uploads | MIME type filter + 20 MB size limit |
| Secret management | All secrets in `.env`, never committed to Git |

---

## Running Tests

```bash
cd backend
npm test
```

Uses `mongodb-memory-server` — no external database needed. Tests cover auth, role guards, event creation, and gallery PIN verification.

---

## Author

**Pranay Patil**
Built for the Full-Stack Developer Internship Selection Challenge.

- GitHub: [github.com/Pranaypatil43](https://github.com/Pranaypatil43)
- Repository: [github.com/Pranaypatil43/snapgallery](https://github.com/Pranaypatil43/snapgallery)
