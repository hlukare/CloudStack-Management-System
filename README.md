# Cloud VM Management System

A cloud infrastructure management platform for monitoring and managing virtual machines across AWS, Azure, and GCP.

## Features

- Multi-authentication (Email/Password, Google OAuth, GitHub OAuth)
- Multi-cloud support (AWS, Azure, GCP)
- Real-time monitoring with metrics
- Cost analysis and optimization
- Automated snapshots
- Configurable alerts
- Analytics dashboard
- Automation rules

## Tech Stack

**Backend:** Node.js, Express, MongoDB, Passport.js, JWT  
**Frontend:** React 18, Vite, Tailwind CSS, Recharts

## Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/hlukare/CloudStack-Management-System.git
cd Folder_Name

# Backend
cd Backend
npm install
cp .env.example .env
# Edit .env with your credentials

# Frontend
cd Frontend
npm install
```

## Configuration

Create `.env` file in Backend directory with these required variables:

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
PORT=5000

# OAuth (optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

OAUTH_CALLBACK_URL=http://localhost:5000
FRONTEND_URL=http://localhost:3000
```

Cloud provider credentials (AWS, Azure, GCP) are optional. System will work without them using demo data.

## OAuth Setup

**Google OAuth:**
- Create credentials at https://console.cloud.google.com/
- Redirect URI: `insert your backend url here`

**GitHub OAuth:**
- Create OAuth App at https://github.com/settings/developers
- Homepage: `insert your frontend url here`
- Callback: `insert your backend url here`


## Running

Start backend:
```bash
cd Backend
npm run dev
```

Start frontend:
```bash
cd Frontend
npm run dev
```

Backend runs on http://localhost:5000  
Frontend runs on http://localhost:3000


## Project Structure

```
Backend/
  - config/       Configuration files
  - models/       Database models
  - routes/       API endpoints
  - services/     Business logic
  - middleware/   Auth & validation

Frontend/
  - src/
    - pages/      Page components
    - components/ Reusable components
    - api/        API client
    - context/    State management
```

## Main API Routes

```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me
GET    /auth/google
GET    /auth/github

GET    /api/vms
POST   /api/vms
GET    /api/vms/:id
PUT    /api/vms/:id
DELETE /api/vms/:id

GET    /api/monitoring/dashboard
GET    /api/costs/summary
GET    /api/snapshots
GET    /api/alerts
```


## Scheduled Tasks

System runs automated background tasks:
- VM monitoring every 5 minutes
- Automated snapshots hourly
- Snapshot cleanup daily at 3 AM
- Cost checks daily at 6 AM
- State sync every 10 minutes

Tasks for unconfigured cloud providers are automatically skipped.

## Common Issues

**MongoDB connection fails:**  
Check MONGODB_URI in .env and network connectivity

**OAuth not working:**  
Verify callback URLs match exactly in provider settings

**Cloud provider errors:**  
Normal if credentials not configured. Add them only for providers you actually use.