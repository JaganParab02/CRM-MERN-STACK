# ISAII - Intelligent Sales AI Interface

A full-stack Customer Relationship Management (CRM) system built with the MERN stack (MongoDB, Express, React, Node.js). This project is designed to help sales teams manage their leads, track deals across a pipeline, handle daily tasks, and leverage AI-driven insights for better decision-making.

---

## 📑 Table of Contents

1. [Features Overview](#features-overview)
2. [Detailed Implementation & Modules](#detailed-implementation--modules)
3. [Technology Stack](#technology-stack)
4. [Project Architecture](#project-architecture)
5. [Local Development & Setup Steps](#local-development--setup-steps)
6. [Default Accounts](#default-accounts)
7. [Future Scope](#future-scope)

---

## 🚀 Features Overview

- **Role-based Authentication:** Secure JWT-based access for Admins and Sales Representatives.
- **Interactive Dashboard:** Live KPIs, dynamic charts (Revenue Forecast, Leads Distribution), and a real-time activity feed.
- **Lead Management:** End-to-end tracking with notes, timelines, deal values, and inline status updates.
- **Kanban Sales Pipeline:** Visual drag-and-drop style board for tracking deal stages from "New" to "Won".
- **Task Management:** Kanban board (To Do, In Progress, Done) with priority tags and due dates.
- **Goals & Quotas:** Auto-calculated progress tracking for revenue and deal-count targets.
- **AI-Powered Insights:** Natural language search, automated lead scoring, AI email drafting, and smart task prioritization.
- **Team & User Management:** Complete admin controls to monitor workload and manage staff accounts.
- **UI/UX:** Modern, responsive layout with dark/light mode toggle and sleek toast notifications.

---

## 🧩 Detailed Implementation & Modules

### 1. Authentication and Authorization
The system uses **JSON Web Tokens (JWT)** for session management. 
- **Login Flow:** `POST /api/auth/login` validates credentials via `bcrypt`. On success, it returns a signed JWT and user object.
- **State Management:** The frontend stores the JWT in `localStorage` and syncs the user profile into a **Zustand** global store.
- **Security:** A `ProtectedRoute` wrapper component blocks unauthorized access. On the backend, `authenticateToken` middleware decodes the JWT, while `authorizeRole` ensures specific endpoints are restricted (e.g., only admins can delete users).
- **Session Handling:** An Axios interceptor catches `401 Unauthorized` responses and automatically logs the user out.

### 2. Dashboard Analytics
The dashboard is role-aware. Admins see global metrics, while Sales Reps only see their assigned data (`{ assignedTo: req.user.id }`).
- **KPI Cards:** Calculates Total Leads, Won Deals, Total Revenue (using MongoDB `$group` and `$sum`), and Conversion Rate.
- **Revenue Forecast:** A 6-month historical area chart built with **Recharts**, dynamically grouping leads by their `createdAt` month.
- **Pipeline Charts:** Donut and Bar charts aggregate leads by their current status.
- **Activity Feed:** Unwinds the embedded `timeline` array from Lead documents to show the 10 most recent global actions, formatted with `date-fns`.

### 3. Lead Management System
The core module for tracking potential customers through the sales funnel.
- **Data Table:** A comprehensive table fetching from `GET /api/leads`. Includes inline status dropdowns that automatically update the database and push a new timeline event.
- **Detail Panel:** Clicking a lead opens a slide-out panel with four tabs:
  - *Details*: Shows contact info, deal value, and AI Win Probability.
  - *Notes*: A chat-style interface for adding updates.
  - *Timeline*: A chronological history of all interactions.
  - *AI Insights*: Interface for AI strategy generation and email drafting.
- **CSV Export:** Client-side generation of CSV files from the current table data.

### 4. Kanban Pipeline & Task Management
- **Sales Pipeline:** Leads are mapped into 7 columns (New, Contacted, Qualified, Proposal, Negotiation, Won, Lost). Includes aggregate deal values per column.
- **Task Board:** Tasks are organized into To Do, In Progress, and Done.
- **Magic Sort (AI):** Collects all "To Do" tasks and sends them to the backend, where the AI evaluates priorities and due dates to return an optimized execution order.

### 5. Goals and Objectives
Admins can set Revenue or Deal-Count goals. The backend dynamically calculates progress in real-time by querying the Leads collection for won deals within the goal's timeframe. Progress bars automatically change color based on completion percentage.

### 6. AI-Powered Features (Groq + LLaMA 3.3)
All AI endpoints use the **Groq API** with the `llama-3.3-70b-versatile` model for lightning-fast responses.
- **Lead Strategy:** Analyzes a lead's notes and timeline to generate a concise, actionable sales strategy.
- **Email Drafting:** Drafts professional follow-up emails based on recent interactions.
- **Predictive Scoring:** Evaluates velocity, deal value, and sentiment to return a 0-100 "Probability to Close" score. (Automatically bypassed if a deal is already Won/Lost).
- **Natural Language Search:** Converts plain-English queries (e.g., *"high priority leads over 50000"*) into valid MongoDB JSON filter objects.

---

## 🛠️ Technology Stack

**Frontend:**
- React 18 (Vite)
- Tailwind CSS (with custom theming)
- Zustand (Global State)
- React Router v6
- Framer Motion (Animations)
- Recharts (Data Visualization)
- React Hot Toast (Notifications)

**Backend:**
- Node.js & Express.js
- MongoDB & Mongoose ODM
- JSON Web Tokens (JWT) & bcryptjs
- OpenAI SDK (Configured for Groq API)

---

## 🏗️ Project Architecture

```text
ISAII/
├── backend/
│   ├── config/          # Database connection
│   ├── middleware/      # JWT auth & role authorization
│   ├── models/          # Mongoose schemas (User, Lead, Task, Goal)
│   ├── routes/          # Express route handlers
│   └── server.js        # Application entry point
│
└── frontend/
    ├── src/
    │   ├── api/         # Axios instance with interceptors
    │   ├── components/  # Reusable UI (Modals, Badges, Layout)
    │   ├── pages/       # Route-level page components
    │   ├── store/       # Zustand stores
    │   ├── App.jsx      # Route configuration
    │   └── index.css    # Tailwind & Theme configurations
    └── tailwind.config.js
```

---

## ⚙️ Local Development & Setup Steps

Follow these steps to get the project running locally.

### Prerequisites
1. **Node.js** (v16 or higher)
2. **MongoDB** (Local instance or MongoDB Atlas cluster)
3. **Groq API Key** (Get one for free at [console.groq.com](https://console.groq.com))

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/isaii-crm.git
cd isaii-crm
```

### 2. Backend Setup
Navigate to the backend directory and install dependencies:
```bash
cd backend
npm install
```

Create a `.env` file in the root of the `backend` folder and add the following variables:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string_here
JWT_SECRET=your_super_secret_jwt_key
FRONTEND_URL=http://localhost:5173
GROQ_API_KEY=your_groq_api_key_here
```

Start the backend server:
```bash
npm run dev
```
*(Note: The server will automatically seed default Admin and Sales accounts upon its first successful connection to the database.)*

### 3. Frontend Setup
Open a new terminal window, navigate to the frontend directory, and install dependencies:
```bash
cd frontend
npm install
```

Start the frontend development server:
```bash
npm run dev
```

The application will now be running at `http://localhost:5173`.

---

## 🔑 Default Accounts

Use these credentials to log in for the first time:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@admin.com` | `admin123` |
| **Sales Rep** | `sales@admin.com` | `sales123` |

---

## 🔮 Future Scope

- **Real-time Synchronization:** Implement WebSockets (Socket.IO) for live updates across multiple users.
- **Calendar Integration:** Sync tasks and meetings with Google Calendar or Outlook APIs.
- **Automated Data Enrichment:** Fetch company details automatically based on email domains.
- **Advanced Reporting:** Scheduled automated PDF reports sent to administrators weekly/monthly.
