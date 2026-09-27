# Smart Workload Capacity Analysis and Task Allocation System

## 1. Project Overview
The Smart Workload Capacity Analysis and Task Allocation System is a comprehensive enterprise application designed to optimize engineering resources. It intelligently matches tasks to team members based on their effective capacity, real-time workload, and existing commitments, preventing burnout and ensuring balanced project delivery.

## 2. Problem Statement
Many engineering teams suffer from unbalanced workloads where some members are overloaded while others are underutilized. Manual task assignment relies on intuition rather than data, leading to missed deadlines, poor capacity planning, and employee burnout. There is a need for a data-driven system that analyzes actual availability to make intelligent assignment recommendations.

## 3. Objectives
* Provide real-time visibility into team workload and capacity.
* Calculate effective capacity by factoring in meetings, leave, and non-project activities.
* Recommend task assignments based on data-driven capacity analysis.
* Offer dedicated role-based views for Admin, Project Managers, HR Managers, and Employees.
* Provide robust reporting and analytics for workforce health monitoring.

## 4. Key Features
* **Role-Based Access Control (RBAC):** Distinct workflows for Admin, Project Manager, Employee, and HR.
* **Capacity Engine:** Calculates remaining capacity dynamically based on task estimates and recorded availability.
* **Intelligent Assignment Recommendation:** Analyzes all team members to suggest the best match for a new task.
* **Workload & Health Reports:** Generates team and individual workload reports with visual utilization indicators (Low, Normal, High, Overloaded).
* **Toast Notifications:** Professional UI feedback for user actions and system alerts.
* **Microservices Architecture:** Scalable, independent backend services routed through an API Gateway.

## 5. System Architecture
The application follows a distributed microservices architecture on the backend, consumed by a React Single Page Application (SPA).

```text
Frontend (React / Vite)
       │
       ▼
  API Gateway (Port 5000)
       │
       ├─▶ User Service (Port 5001)
       ├─▶ Project Service (Port 5002)
       ├─▶ Task Service (Port 5003)
       ├─▶ Capacity Analysis Service (Port 5004)
       ├─▶ Report Service (Port 5005)
       └─▶ Notification Service (Port 5006)
```
*All microservices persist data to a shared MongoDB instance.*

## 6. Microservices
* **API Gateway:** Centralized routing and request proxying.
* **User Service:** Authentication, authorization, and profile management.
* **Project Service:** Management of projects, sprints, and teams.
* **Task Service:** Task creation, effort estimation, assignment, and status tracking.
* **Capacity Service:** Calculates effective capacity and provides assignment recommendations.
* **Report Service:** Generates CSV exports and aggregate analytics.
* **Notification Service:** Asynchronous internal messaging.

## 7. Technology Stack
* **Frontend:** React, Vite, React Router, Context API, Vanilla CSS.
* **Backend:** Node.js, Express.js.
* **Database:** MongoDB (via Mongoose).
* **Testing:** Node-based E2E scripts.

## 8. Project Structure
```text
smart-workload-system/
├── frontend/                # React SPA source code
├── gateway/                 # API Gateway logic
├── services/                # Backend Microservices
│   ├── capacity-service/
│   ├── notification-service/
│   ├── project-service/
│   ├── report-service/
│   ├── task-service/
│   └── user-service/
├── shared/                  # Shared Mongoose models and utilities
├── .env.example             # Environment configuration template
├── package.json             # Root dependencies and scripts
├── mongo-server.js          # In-memory MongoDB runner
├── seed.js                  # Database seeding script
├── start-all.js             # Microservices orchestrator script
├── e2e-workflow-test.js     # End-to-end verification script
└── README.md                # Project documentation
```

## 9. Prerequisites
* Node.js (v18 or higher recommended)
* npm (Node Package Manager)

## 10. Environment Configuration
The system requires an environment file for port definitions, MongoDB URI, and JWT secrets.
1. Copy `.env.example` to `.env` in the root directory.
2. Ensure `MONGO_URI` points to your active MongoDB instance (or use the built-in `mongo-server.js`).

## 11. Installation
1. Clone the repository.
2. Run `npm install` in the root directory to install backend dependencies.
3. Navigate to `frontend/` and run `npm install` to install frontend dependencies.

## 12. Running the Application
**Backend Services:**
```bash
node start-all.js
```
*(Optionally run `node mongo-server.js` in a separate terminal if you don't have a local MongoDB instance running).*

**Frontend Development Server:**
```bash
cd frontend
npm run dev
```

## 13. Database Setup
The application uses MongoDB. You can use a local system installation, MongoDB Atlas, or the included `mongodb-memory-server` runner (`node mongo-server.js`).

## 14. Seed/Demo Data
To populate the database with realistic software engineering projects, sprints, tasks, and users:
```bash
node seed.js
```

## 15. Demo Accounts
After running `seed.js`, the following accounts are available (Password for all: `Password@123`):
* **Admin:** `admin@example.com`
* **Project Manager:** `manager@example.com`
* **HR Manager:** `hr@example.com`
* **Employees:** `employee1@example.com` to `employee5@example.com`

## 16. API Gateway
All frontend requests route through the API Gateway at `http://localhost:5000/api`. The Gateway securely proxies requests to the respective microservices.

## 17. Main Workflow
1. **Manager:** Creates a Project and a Sprint.
2. **Manager:** Creates a Task with an estimated effort (e.g., 5 hours).
3. **Manager:** Clicks "Analyze Employee Capacity" to request an assignment recommendation.
4. **Capacity Service:** Evaluates all team members, deducting meetings/leave, and recommends the engineer with the optimal remaining capacity.
5. **Manager:** Confirms assignment. Notification is triggered.
6. **Employee:** Views "My Tasks" and logs actual effort. Capacity is automatically recalculated.
7. **HR:** Monitors organizational health via the HR Dashboard.

## 18. Testing / Verification
To verify the complete system health and end-to-end integration:
```bash
node verify-health.js
node e2e-workflow-test.js
```
*These scripts validate all internal API contracts and the critical capacity analysis flow.*

## 19. Frontend Build
To build the frontend for production:
```bash
cd frontend
npm run build
```

## 20. External Integration Adapters / Mock Mode
The `.env.example` includes placeholders for SMTP, Cloudinary, AWS, Google Calendar, and external HRMS. Currently, the system uses internal logic (mock adapters) for these integrations to ensure portability for academic demonstration.

## 21. Project Status
Development and UI/UX polish completed. Verified functional. Ready for academic review and SRS/UML mapping.

## 22. Future Enhancements
* Real OAuth/SSO integration.
* Live WebSocket updates for notifications.
* Direct integration with real Google Calendar and enterprise HRMS APIs.

## 23. License
This is an academic Software Engineering project.
