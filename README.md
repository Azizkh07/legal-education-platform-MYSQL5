# Legal Education Platform - Clinique des Juristes

A comprehensive legal education platform built for managing courses, videos, and educational content with secure access control.

## 🏗️ Architecture

- **Frontend**: Next.js 13 + React 18 + TypeScript + TailwindCSS
- **Backend**: Express.js + TypeScript + PostgreSQL
- **Authentication**: JWT + Express Sessions
- **File Upload**: Multer for video uploads
- **Database**: PostgreSQL with proper indexing

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 13+
- Git

### Installation

1. **Clone and Setup**
```bash
git clone <repository-url>
cd legal-education-platform
```

2. **Backend Setup**
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your database credentials
npm run db:setup
```

3. **Frontend Setup**
```bash
cd ../frontend
npm install
cp .env.local.example .env.local
```

4. **Start Development**
```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend  
cd frontend && npm run dev
```

5. **Access Application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Admin Login: admin@cliniquedujuriste.com / admin123

## 📁 Project Structure

```
legal-education-platform/
├── frontend/                 # Next.js React application
│   ├── components/          # Reusable UI components
│   ├── pages/              # Next.js pages/routes
│   ├── lib/                # Utility functions
│   ├── types/              # TypeScript type definitions
│   └── styles/             # Global styles and Tailwind config
│
└── backend/                 # Express.js API server
    ├── src/
    │   ├── config/         # Database and app configuration
    │   ├── models/         # Database models and queries
    │   ├── controllers/    # Route handlers and business logic
    │   ├── routes/         # API route definitions
    │   ├── middleware/     # Authentication and validation
    │   └── types/          # TypeScript interfaces
    ├── uploads/videos/     # Video file storage
    └── database/           # SQL schema and migrations
```

## 🔐 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Multi-Session Support**: Users can login from multiple devices
- **Protected Video Streaming**: Videos accessible only to assigned users
- **Admin-Only User Creation**: No public registration
- **Course Access Control**: Users see only assigned courses
- **Rate Limiting**: API endpoint protection
- **Password Hashing**: bcrypt with 12 salt rounds

## 📊 Database Schema

### Core Tables
- **users**: User accounts with approval system
- **courses**: Course information and metadata
- **videos**: Video files linked to courses
- **user_courses**: User-course assignments
- **blog_posts**: Admin-created articles
- **sessions**: Express session storage

## 🎯 Key Features

### Admin Dashboard (`/admin`)
- User management (create, approve, assign courses)
- Course creation and editing
- Video upload with drag & drop
- Blog post management
- Course assignment to users

### User Dashboard (`/mon-espace`)
- View assigned courses only
- Secure video streaming
- Course progress tracking
- No download capabilities

### Public Pages
- Homepage with latest courses/articles
- Individual course pages
- Blog article pages
- Login/authentication

## 🔧 Development

### Available Scripts

#### Backend
```bash
npm run dev          # Start development server
npm run build        # Build TypeScript
npm start           # Start production server
npm run db:setup    # Initialize database
```

#### Frontend
```bash
npm run dev         # Start development server
npm run build       # Build for production
npm start          # Start production server
npm run lint       # Run ESLint
```

### Authentication
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `GET /auth/me` - Get current user

### Admin Routes
- `GET /admin/users` - List all users
- `POST /admin/users` - Create new user
- `PUT /admin/users/:id/approve` - Approve user
- `POST /admin/courses` - Create course
- `POST /admin/videos` - Upload video
- `POST /admin/assign-course` - Assign user to course

### User Routes
- `GET /user/courses` - Get user's assigned courses
- `GET /user/course/:id` - Get course details
- `GET /stream/:videoId` - Stream protected video

### Public Routes
- `GET /courses/latest` - Latest courses
- `GET /blog/latest` - Latest blog posts
- `GET /blog/:slug` - Get blog post by slug

## 🎨 UI/UX Guidelines

### Design System
- **Colors**: Primary green (#10b981), neutral grays
- **Typography**: Inter font family
- **Spacing**: Tailwind spacing scale
- **Components**: Consistent button styles, form inputs
- **Responsive**: Mobile-first design approach

### Page Consistency
All pages follow the homepage design:
- Consistent header with navigation
- Same color scheme and typography
- Unified button and form styles
- Responsive grid layouts