# PhotoShare — Event Gallery Platform

A full-stack photo-sharing platform built for the **TrizenAI Full-Stack Internship Challenge**.

A photography / event team can collaboratively upload photos for an event, an Admin can curate
and publish a PIN-protected gallery, and customers can access it via a shareable link — no account required.

---

## Live Application

| Resource | URL |
|---|---|
| Frontend | _Add your deployed URL here_ |
| Backend API | _Add your deployed API URL here_ |
| Demo Gallery | _Add your demo gallery URL here_ |

### Demo Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@demo.com | demo1234 |
| Team Member | member@demo.com | demo1234 |

**Demo Gallery PIN:** `482917`

---

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite 5, React Router 6, Tailwind CSS 3, Axios |
| Backend | Node.js, Express 4 |
| Database | MongoDB (Mongoose ODM) |
| File Storage | Cloudinary (object storage, auto-thumbnail generation) |
| Authentication | JWT (jsonwebtoken) + bcryptjs |
| Testing | Jest + Supertest + mongodb-memory-server |
| Deployment | Render / Railway (backend) · Vercel / Netlify (frontend) |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                        │
│  React + Vite + Tailwind                                        │
│  /login  /register  /admin  /admin/events/:id  /team            │
│  /gallery/:slug  (public, PIN-protected)                        │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS / REST JSON
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                       EXPRESS API (Node.js)                     │
│                                                                 │
│  /api/auth        register · login · me                        │
│  /api/events      CRUD · add/remove members                    │
│  /api/photos      upload (multipart) · list · delete           │
│  /api/galleries   create · publish · public verify (PIN)       │
│                                                                 │
│  Middleware: authenticate (JWT) · authorize (role) · validate  │
└────────┬────────────────────────────────┬───────────────────────┘
         │ Mongoose                        │ Cloudinary SDK
         ▼                                ▼
┌─────────────────┐             ┌──────────────────────┐
│    MongoDB      │             │  Cloudinary Storage  │
│  Users          │             │  /photo-sharing/     │
│  Events         │             │    {eventId}/        │
│  Photos         │             │      *.jpg …         │
│  Galleries      │             └──────────────────────┘
└─────────────────┘
```

---

## Database Schema

### User
| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | |
| `name` | String | required |
| `email` | String | unique, lowercase |
| `password` | String | bcrypt-hashed, `select: false` |
| `role` | Enum | `admin` \| `team_member` |
| `createdAt` | Date | auto |

### Event
| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | |
| `name` | String | required |
| `description` | String | optional |
| `date` | Date | optional |
| `createdBy` | ObjectId → User | admin owner |
| `teamMembers` | [ObjectId → User] | assigned members |

### Photo
| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | |
| `eventId` | ObjectId → Event | |
| `uploadedBy` | ObjectId → User | |
| `filename` | String | original filename |
| `storagePublicId` | String | Cloudinary `public_id` |
| `storageUrl` | String | Cloudinary secure URL |
| `thumbnailUrl` | String | 400×300 auto-cropped |
| `fileSize` | Number | bytes |
| `mimeType` | String | |

### Gallery
| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | |
| `eventId` | ObjectId → Event | one gallery per event |
| `createdBy` | ObjectId → User | admin |
| `title` | String | required |
| `selectedPhotos` | [ObjectId → Photo] | curated selection |
| `slug` | String | unique 10-char URL slug |
| `pinHash` | String | bcrypt-hashed PIN, `select: false` |
| `isPublished` | Boolean | default `false` |
| `publishedAt` | Date | set on publish |
| `expiresAt` | Date | optional expiry |

---

## API Reference

### Auth
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | — | Register (first user → admin) |
| POST | `/api/auth/login` | — | Login, returns JWT |
| GET | `/api/auth/me` | JWT | Current user profile |

### Events
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/events` | admin | Create event |
| GET | `/api/events` | JWT | List accessible events |
| GET | `/api/events/:id` | JWT | Single event detail |
| POST | `/api/events/:id/members` | admin | Add team members |
| DELETE | `/api/events/:id/members/:memberId` | admin | Remove member |
| GET | `/api/events/users/team-members` | admin | List all team members |

### Photos
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/photos/:eventId` | JWT | Upload photos (multipart, max 20) |
| GET | `/api/photos/event/:eventId` | JWT | List photos (admin: all; member: own) |
| DELETE | `/api/photos/:photoId` | JWT | Delete photo (owner or admin) |

### Galleries
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/galleries` | admin | Create / update gallery |
| PATCH | `/api/galleries/:id/publish` | admin | Publish, returns share URL |
| PATCH | `/api/galleries/:id/unpublish` | admin | Unpublish |
| GET | `/api/galleries/admin` | admin | List admin's galleries |
| GET | `/api/galleries/event/:eventId` | admin | Gallery for event |
| GET | `/api/galleries/public/:slug` | — | Check gallery exists (no PIN) |
| POST | `/api/galleries/public/:slug/verify` | — | Verify PIN, returns photos |

---

## Local Setup

### Prerequisites
- Node.js ≥ 18
- MongoDB running locally (or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster)
- A free [Cloudinary](https://cloudinary.com) account

### 1. Clone and install

```bash
git clone <your-repo-url>
cd "Photo shearing webside"

# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure environment variables

```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env — fill in MONGODB_URI, JWT_SECRET, CLOUDINARY_*

# Frontend (optional for local dev — Vite proxy handles /api → localhost:5000)
cp frontend/.env.example frontend/.env
```

### 3. Run in development

```bash
# Terminal 1 — backend (port 5000)
cd backend
npm run dev

# Terminal 2 — frontend (port 5173)
cd frontend
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

### 4. Run tests

```bash
cd backend
npm test
```

31 tests run fully in-process via `mongodb-memory-server` — no external database needed.

---

## Deployment

### Backend (Render / Railway)

1. Create a new web service pointed at the `backend/` directory.
2. Set build command: `npm install`
3. Set start command: `node src/server.js`
4. Add all environment variables from `.env.example`.
5. Set `ALLOWED_ORIGINS` to your frontend's production URL.
6. Set `FRONTEND_URL` to your frontend's production URL.

### Frontend (Vercel / Netlify)

1. Set root directory to `frontend/`.
2. Build command: `npm run build`
3. Output directory: `dist`
4. Set `VITE_API_URL` to your deployed backend URL (e.g. `https://your-api.onrender.com/api`).
5. Add a rewrite rule: `/* → /index.html` (for React Router).

---

## Security Measures

- Passwords hashed with **bcrypt** (12 salt rounds)
- Gallery PINs also bcrypt-hashed — plain PIN never stored
- JWT tokens expire in 7 days; verified on every protected request
- Role-based access: team members cannot publish galleries or access other users' photos
- Cloudinary file filter enforces image MIME types only (20 MB max per file)
- CORS restricted to configured origins
- Input validated with `express-validator` on all routes
- `pinHash` excluded from all API responses via `select: false`

---

## Known Limitations

- Gallery PIN cannot currently be changed without re-saving the entire gallery (entering a new PIN in the form updates it).
- No email-based invite flow for team members — admin must add them by selecting from registered users.
- Cloudinary free tier has a 25 GB storage / 25 GB bandwidth monthly limit.
- No refresh token mechanism — users must re-login after 7 days.

---

## Optional / Bonus Features Implemented

- **Image thumbnails** — Cloudinary auto-generates 400×300 thumbnails on upload
- **Lightbox viewer** — click any photo in the gallery to view full size
- **Drag-and-drop upload** with per-file progress bar
- **Gallery expiry field** (model + API support; UI coming)
- **Copy share link** button on dashboard and event detail page

---

## Project Structure

```
Photo shearing webside/
├── backend/
│   ├── src/
│   │   ├── config/          # db.js, cloudinary.js
│   │   ├── middleware/      # auth.js, validate.js
│   │   ├── models/          # User, Event, Photo, Gallery
│   │   ├── routes/          # auth, events, photos, galleries
│   │   ├── tests/           # auth, events, galleries test suites
│   │   ├── app.js           # Express app (no side effects)
│   │   └── server.js        # Entry point — connects DB, starts server
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── api/             # axios instance + per-resource modules
│   │   ├── components/      # Navbar, PhotoGrid, UploadModal, PinEntry, …
│   │   ├── context/         # AuthContext
│   │   ├── pages/           # LoginPage, RegisterPage, AdminDashboard, …
│   │   ├── App.jsx          # Route definitions + ProtectedRoute
│   │   ├── main.jsx         # React root
│   │   └── index.css        # Tailwind + custom utility classes
│   ├── .env.example
│   ├── vite.config.js
│   └── package.json
│
├── .gitignore
└── README.md
```
