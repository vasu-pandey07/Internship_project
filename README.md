# EduPlatform — Education Learning Platform

A production-ready **Coursera/Udemy-style** education platform built with the **MERN stack**.

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

## 📝 License

MIT
