# 🎓 KLU Assignment Tracker

<div align="center">

![GitHub repo size](https://img.shields.io/github/repo-size/ayushcoder786/klu-assignment-tracker?style=for-the-badge&color=00D26A)
![GitHub stars](https://img.shields.io/github/stars/ayushcoder786/klu-assignment-tracker?style=for-the-badge&color=FFE600)
![GitHub forks](https://img.shields.io/github/forks/ayushcoder786/klu-assignment-tracker?style=for-the-badge&color=00A3FF)
![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)

**A high-performance, Progressive Web App (PWA) & backend service for KL University students to seamlessly track assignments, exams, deadlines, and receive automated Web Push notifications with zero hassle.**

[Features](#-key-features) • [Architecture](#-system-architecture) • [Tech Stack](#-tech-stack) • [Quick Start](#-getting-started) • [Deployment](#-production-deployment) • [API Docs](#-api-endpoints) • [Security](#-security--privacy)

</div>

---

## 📌 Overview

**KLU Assignment Tracker** bridges the gap between the official KL University Moodle LMS (`lms.kluniversity.in`) and a modern, lightning-fast digital experience. It provides automated synchronization of academic coursework, exams, and deliverables, paired with intelligent reminder notifications and analytics, available as an installable PWA on both desktop and mobile devices.

---

## ✨ Key Features

- 🔄 **Live LMS Synchronization**: Seamless integration with Moodle Mobile REST APIs to fetch enrolled courses, upcoming assignments, and examination dates.
- 🔔 **Automated Web Push Notifications**: Native browser push notifications powered by VAPID (Voluntary Application Server Identification) for assignment due reminders and urgency alerts.
- 📱 **Progressive Web App (PWA)**: Installable on Android, iOS, Windows, and macOS with offline support and caching via Service Workers (`workbox`).
- 📊 **Insightful Student Analytics**: Completion rate trends, workload distribution charts, and urgency breakdown powered by Recharts.
- 🛡️ **Zero Credential Persistence**: Student LMS passwords are never saved to any database. In-memory transient token exchanges guarantee optimal privacy.
- 🎛️ **Admin & Monitoring Dashboard**: Real-time sync logs, health actuators, background job status, and multi-user metrics for university administrators.
- 🌗 **Modern Dark / Light Theme**: Built with Tailwind CSS v4 featuring responsive design, glassmorphic cards, smooth micro-interactions, and accessible typography.

---

## 🏛️ System Architecture

```
                                  ┌─────────────────────────────┐
                                  │   KLU University Moodle     │
                                  │ (lms.kluniversity.in/login) │
                                  └──────────────▲──────────────┘
                                                 │
                                                 │ Moodle Web Services
                                                 │ (token.php / REST)
                                                 ▼
┌──────────────────────────┐    HTTPS / WSS    ┌─────────────────────────────┐
│    Frontend PWA          │ ────────────────► │    Backend Web Service      │
│  (React 19 + TypeScript  │ ◄──────────────── │  (Spring Boot / Java 17+    │
│   on Vercel / Netlify)   │    REST / JSON    │   on Render / Railway)      │
└──────────────────────────┘                   └──────────────┬──────────────┘
       ▲            ▲                                         │
       │            │                                         │
  Web  │            │ Push                                    │
  Push │            │ Payload                                 │ Spring Data
       │            │                                         │ MongoDB
┌──────┴────────────┴──────┐                   ┌──────────────▼──────────────┐
│  Browser / OS Notification│                   │    MongoDB Atlas Cluster    │
│  Service (FCM / Mozilla) │                   │  (Database: assignment_db)  │
└──────────────────────────┘                   └─────────────────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: [React 19](https://react.dev/) with [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite 8](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Routing**: [React Router DOM v7](https://reactrouter.com/)
- **Charts & Visualizations**: [Recharts](https://recharts.org/)
- **Icons**: [React Icons](https://react-icons.github.io/react-icons/)
- **PWA & Offline Engine**: `vite-plugin-pwa`, Workbox Service Workers

### Backend
- **Framework**: [Spring Boot 4](https://spring.io/projects/spring-boot) (Java 17+)
- **Security**: Spring Security with stateless JSON Web Tokens (JJWT 0.12)
- **Database**: [MongoDB Atlas](https://www.mongodb.com/atlas) via Spring Data MongoDB
- **Push Notification Engine**: `nl.martijndwars:web-push` with BouncyCastle cryptography
- **Observability**: Spring Boot Actuator

---

## 📂 Project Structure

```bash
KLU-Assignment-Tracker/
├── .env.example               # Root environment variable template
├── backend/
│   └── assignment-tracker/
│       ├── Dockerfile         # Multi-stage production container build
│       ├── pom.xml            # Maven dependencies & build configuration
│       └── src/
│           ├── main/
│           │   ├── java/com/klu/assignmenttracker/
│           │   │   ├── config/       # Security, CORS, WebMvc, MongoDB config
│           │   │   ├── controller/   # REST API Controllers (Auth, Admin, Exams, etc.)
│           │   │   ├── dto/          # Data Transfer Objects & Request/Response schemas
│           │   │   ├── model/        # MongoDB Document Entities (User, Assignment, Exam)
│           │   │   ├── repository/   # Spring Data Mongo Repositories
│           │   │   ├── security/     # JWT Authentication Filters & Entry Points
│           │   │   ├── service/      # LMS Integration, Push Service, Sync Schedulers
│           │   │   ├── GenerateVapidKeys.java  # VAPID Keypair Generation Utility
│           │   │   └── AssignmentTrackerApplication.java
│           │   └── resources/
│           │       └── application.properties
│           └── test/                 # JUnit & Mockito unit tests
├── frontend/
│   ├── index.html             # HTML entry point with PWA meta tags
│   ├── package.json           # Frontend dependencies & scripts
│   ├── vite.config.ts         # Vite configuration with PWA plugin
│   ├── vercel.json            # Vercel SPA rewrite & header configuration
│   └── src/
│       ├── components/        # Reusable UI elements (Navbar, Cards, Badges, Modals)
│       ├── context/           # AuthContext, NotificationContext, ThemeContext
│       ├── pages/
│       │   ├── Landing.tsx    # Welcome & Showcase landing page
│       │   ├── student/       # Dashboard, Assignment List/Detail, Exam List, Settings
│       │   └── admin/         # Admin Dashboard, Sync Logs, Student Monitor
│       ├── services/          # Axios/Fetch API client layer
│       └── sw.ts              # Custom PWA service worker with push handlers
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- **Java**: JDK 17 or higher
- **Node.js**: v18.x or higher & npm
- **Database**: Local MongoDB instance or free [MongoDB Atlas](https://www.mongodb.com/atlas) Cluster
- **Git**

---

### 1. Clone the Repository
```bash
git clone https://github.com/ayushcoder786/klu-assignment-tracker.git
cd KLU-Assignment-Tracker
```

---

### 2. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend/assignment-tracker
   ```
2. Generate your VAPID keys for push notifications (one-time setup):
   ```bash
   ./mvnw compile exec:java -Dexec.mainClass=com.klu.assignmenttracker.GenerateVapidKeys
   ```
3. Create your `.env` file or export your environment variables:
   ```bash
   cp ../../.env.example .env
   ```
4. Run the Spring Boot application:
   ```bash
   ./mvnw spring-boot:run
   ```
   The backend API will start at `http://localhost:8081`.

---

### 3. Frontend Setup
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure frontend environment variables:
   ```bash
   cp .env.example .env
   ```
   *(Ensure `VITE_API_BASE_URL=http://localhost:8081` during local development)*
4. Start the Vite development server:
   ```bash
   npm run dev
   ```
   Access the web app at `http://localhost:5173`.

---

## ⚙️ Environment Variables Reference

### Backend (`backend/assignment-tracker`)

| Variable Name | Required | Default / Example | Description |
|---|:---:|---|---|
| `PORT` | Optional | `8081` | Server listening port |
| `MONGODB_URI` | **Required** | `mongodb+srv://<user>:<pwd>@cluster.mongodb.net/klu_tracker` | MongoDB connection string |
| `MONGODB_DATABASE` | Optional | `klu_assignment_tracker` | Database name |
| `JWT_SECRET` | **Required** | `openssl rand -base64 32` | Secret key for signing student JWTs |
| `JWT_EXPIRATION_MS` | Optional | `86400000` (24h) | JWT validity duration |
| `FRONTEND_URL` | **Required** | `https://klu-tracker.vercel.app` | Allowed CORS origins (comma-separated) |
| `VAPID_PUBLIC_KEY` | **Required** | `87-char Base64url EC key` | VAPID public key for Web Push |
| `VAPID_PRIVATE_KEY` | **Required** | `44-char Base64url EC key` | VAPID private key |
| `VAPID_SUBJECT` | Optional | `mailto:admin@example.com` | Mailto URI identifying push sender |
| `LMS_TOKEN_URL` | Optional | `https://lms.kluniversity.in/login/token.php` | KLU Moodle token endpoint |
| `LMS_REST_URL` | Optional | `https://lms.kluniversity.in/webservice/rest/server.php` | KLU Moodle REST API endpoint |
| `SYNC_INTERVAL_MINUTES` | Optional | `30` | Interval for automatic background sync |

### Frontend (`frontend`)

| Variable Name | Required | Default / Example | Description |
|---|:---:|---|---|
| `VITE_API_BASE_URL` | **Required in Prod** | `https://klu-tracker-api.onrender.com` | Deployed backend base URL |

---

## 🚢 Production Deployment

### 1. Database (MongoDB Atlas)
1. Create a free M0 cluster on [MongoDB Atlas](https://www.mongodb.com/atlas).
2. Create a database user and allow network access (`0.0.0.0/0` or cloud IP).
3. Obtain your connection string: `mongodb+srv://<user>:<password>@cluster0.mongodb.net/klu_assignment_tracker?authSource=admin`.

### 2. Backend (Render / Railway / Docker)
1. In [Render Dashboard](https://dashboard.render.com), select **New +** -> **Web Service**.
2. Connect your repository and set the **Root Directory** to `backend/assignment-tracker`.
3. Set build configuration:
   - **Build Command**: `./mvnw clean package -DskipTests`
   - **Start Command**: `java -jar target/assignment-tracker-0.0.1-SNAPSHOT.jar`
   *(Alternatively, deploy directly using the provided `Dockerfile`)*
4. Inject all backend environment variables from the table above.
5. Deploy and note your backend URL (e.g., `https://klu-tracker-api.onrender.com`).

### 3. Frontend (Vercel / Netlify)
1. In [Vercel Dashboard](https://vercel.com), select **Add New...** -> **Project**.
2. Connect your Git repository and set **Root Directory** to `frontend`.
3. Select framework preset **Vite**.
4. Configure environment variable: `VITE_API_BASE_URL = https://klu-tracker-api.onrender.com`.
5. Deploy. Update the backend `FRONTEND_URL` environment variable with your production Vercel URL.

---

## 📡 API Endpoints

### 🔐 Authentication (`/api/auth`)
- `POST /api/auth/login` - Authenticate student using KLU LMS credentials & return JWT.
- `POST /api/auth/logout` - Invalidate current session.

### 📚 Assignments & Courses (`/api/assignments`, `/api/courses`)
- `GET /api/assignments` - Fetch list of user assignments with filtering & search.
- `GET /api/assignments/{id}` - Fetch single assignment details.
- `PATCH /api/assignments/{id}/status` - Toggle custom completion status.

### 📝 Exams (`/api/exams`)
- `GET /api/exams` - Fetch upcoming schedule of academic tests and examinations.
- `GET /api/exams/{id}` - Fetch specific exam syllabus and timing.

### 🔔 Push Notifications (`/api/notifications`)
- `GET /api/notifications/vapid-public-key` - Fetch server VAPID public key.
- `POST /api/notifications/subscribe` - Register browser Web Push subscription.
- `POST /api/notifications/unsubscribe` - Deregister device subscription.
- `PUT /api/notifications/preferences` - Update reminder interval preferences.

### 🛠️ Admin & Sync (`/api/admin`, `/api/sync`)
- `POST /api/sync/trigger` - Force immediate LMS synchronization.
- `GET /api/admin/sync-logs` - Inspect recent background synchronization logs.
- `GET /api/admin/students` - View aggregate student activity metrics.

---

## 🔒 Security & Privacy

- 🛡️ **Zero Password Storage**: Student passwords are authenticated directly against KLU Moodle's official token endpoint and are never stored or logged in our databases.
- 🔑 **Cryptographic Push Security**: Web push alerts are signed with standard RFC-8292 VAPID Elliptic Curve cryptography.
- 🌐 **Strict CORS Policies**: Cross-Origin Resource Sharing is locked down strictly to the registered frontend domain.
- ⚡ **Stateless Authorization**: Requests are verified via stateless JWT bearer headers with signed signatures.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!
1. Fork the project (`https://github.com/ayushcoder786/klu-assignment-tracker/fork`)
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the **MIT License**.

<div align="center">
  <sub>Built with ❤️ for KL University Students</sub>
</div>
