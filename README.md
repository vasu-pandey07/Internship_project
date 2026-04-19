# EduPlatform — Education Learning Platform

A production-ready **Coursera/Udemy-style** education platform built with the **MERN stack**.

![Backend CI/CD](https://github.com/<OWNER>/<REPO>/actions/workflows/backend.yml/badge.svg)
![Frontend CI/CD](https://github.com/<OWNER>/<REPO>/actions/workflows/frontend.yml/badge.svg)

## 🚀 Features

### 🎓 Student
- Sign up / Login (JWT auth)
- Browse & search courses (category, level, search, sort)
- Enroll in free or paid courses (Stripe)
- Watch video lectures
- Track progress per lesson
- Take quizzes with auto-grading
- View certificates on completion
- Bookmark courses
- Get personalized recommendations

### 👨‍🏫 Instructor
- Create / edit / delete courses
- Upload videos & thumbnails (Cloudinary)
- Add quizzes with multiple-choice questions
- Submit courses for admin approval
- View analytics (students, ratings)

### 🛠️ Admin
- Platform analytics dashboard (users, courses, revenue, enrollments)
- Approve / reject courses
- Manage users (role changes, deletion)

### ⚡ Advanced
- Role-based access control (RBAC)
- Real-time notifications (Socket.io)
- Content-based course recommendations
- Payment integration (Stripe Checkout)
- Review & rating system
- Dark mode
- Pagination & filtering
- Rate limiting & security (Helmet, CORS)

---

## 📦 Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 19 + Vite, Redux Toolkit, Tailwind CSS v4, React Router v7 |
| Backend | Node.js, Express.js, Mongoose |
| Database | MongoDB |
| Auth | JWT + bcrypt |
| Storage | Cloudinary (videos/images) |
| Payments | Stripe |
| Real-time | Socket.io |

---

## 🏗️ Getting Started

### Prerequisites
- Node.js v18+
- MongoDB (local or [MongoDB Atlas](https://www.mongodb.com/atlas))
- [Cloudinary](https://cloudinary.com/) account (free tier works)
- [Stripe](https://stripe.com/) account (test keys)

### 1. Clone & Install

```bash
# Backend
cd server
npm install

# Frontend
cd ../client
npm install
```

### 2. Configure Environment

Copy `server/.env.example` to `server/.env` and fill in your values:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/eduplatform
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
CLIENT_URL=http://localhost:5173
```

### 3. Run Development Servers

```bash
# Terminal 1 — Backend (port 5000)
cd server
npm run dev

# Terminal 2 — Frontend (port 5173)
cd client
npm run dev
```

Open **http://localhost:5173** in your browser.

### 4. Create Admin Account

Register a user normally, then update the role in MongoDB shell:

```js
db.users.updateOne({ email: "admin@example.com" }, { $set: { role: "admin" } })
```

---

## 📁 Project Structure

```
├── server/
│   ├── config/         # DB, Cloudinary, Stripe configs
│   ├── controllers/    # Route handlers (10 controllers)
│   ├── middleware/      # Auth, RBAC, error handler, upload
│   ├── models/          # Mongoose schemas (9 models)
│   ├── routes/          # Express routes (10 route files)
│   ├── services/        # Business logic helpers
│   ├── socket/          # Socket.io real-time setup
│   ├── utils/           # Helpers, validators
│   └── server.js        # Entry point
│
├── client/
│   └── src/
│       ├── api/         # Axios instance with interceptors
│       ├── app/         # Redux store
│       ├── components/  # Shared UI (Navbar, Footer, CourseCard, etc.)
│       ├── features/    # Redux slices (auth, courses, enrollments)
│       ├── hooks/       # useDarkMode
│       ├── pages/       # Route pages (9 pages)
│       ├── socket.js    # Socket.io client
│       ├── App.jsx      # Router + layout
│       └── main.jsx     # Entry point
└── README.md
```

---

## 🔌 API Endpoints

| Area | Endpoints |
|---|---|
| Auth | `POST /register`, `POST /login`, `GET/PUT /me` |
| Courses | `GET /`, `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id`, `GET /my-courses`, `GET /recommendations` |
| Lessons | `POST /`, `PUT /:id`, `DELETE /:id` (nested under courses) |
| Enrollments | `POST /`, `GET /my`, `PUT /:id/progress`, `GET /:id/certificate` |
| Quizzes | `POST /`, `GET /`, `GET /:id`, `POST /:id/attempt` |
| Reviews | `POST /`, `GET /` |
| Bookmarks | `POST /:courseId`, `GET /` |
| Payments | `POST /create-checkout`, `POST /webhook`, `GET /verify/:sessionId` |
| Admin | `GET /users`, `PUT /users/:id/role`, `DELETE /users/:id`, `GET /courses/pending`, `PUT /courses/:id/status`, `GET /analytics` |
| Notifications | `GET /`, `PUT /:id/read`, `PUT /read-all` |

All routes prefixed with `/api/v1`.

---

## CI/CD (GitHub Actions)

Workflows are split by app layer:

- Backend workflow: `.github/workflows/backend.yml`
- Frontend workflow: `.github/workflows/frontend.yml`

Both workflows run on push to `main`, use Node.js LTS, install dependencies with `npm ci`, enable npm dependency caching, and separate build/test from deployment.

### 1. Configure GitHub Secrets

In GitHub: **Repository -> Settings -> Secrets and variables -> Actions -> New repository secret**

Required backend application secrets:

- `MONGO_URI`
- `JWT_SECRET`
- `STRIPE_SECRET_KEY`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

Backend deployment secrets (Render):

- Option A (recommended): `RENDER_DEPLOY_HOOK_URL`
- Option B: `RENDER_API_KEY` and `RENDER_SERVICE_ID`

Frontend deployment secrets:

- Vercel option: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`
- Render static site option: `RENDER_STATIC_DEPLOY_HOOK_URL`

Optional deployment notification secret:

- `DEPLOYMENT_WEBHOOK_URL` (Slack/Teams/Discord compatible incoming webhook)

### 2. Render backend setup

1. Open Render dashboard and select your backend web service.
2. In **Settings**, copy the Deploy Hook URL and save it as `RENDER_DEPLOY_HOOK_URL` in GitHub Secrets.
3. Keep environment variables in Render service settings (runtime) and in GitHub Secrets (for CI test/build usage).

### 3. Vercel frontend setup

1. Import the `client` app into Vercel.
2. From Vercel project settings, copy `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID`.
3. Create a Vercel token and save all three values as GitHub Secrets.

### 4. Enable badges

Replace `<OWNER>/<REPO>` in the badge URLs near the top of this README with your actual GitHub owner and repository name.

### 5. Workflow behavior summary

- Backend: checkout -> setup Node LTS -> install -> lint -> test -> build -> deploy to Render.
- Frontend: checkout -> setup Node LTS -> install -> lint -> build Vite app -> deploy to Vercel (fallback to Render static hook).
- Deploy jobs run only after successful build jobs.
- Notifications are posted on success/failure when `DEPLOYMENT_WEBHOOK_URL` is configured.

---

## 📝 License

MIT
