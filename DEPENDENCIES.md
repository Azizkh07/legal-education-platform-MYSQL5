# Legal Education Platform - Complete Dependencies Guide

## Project Overview
A legal education platform for "Clinique des Juristes" built with React/Next.js frontend and Express.js backend.

## System Requirements

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **PostgreSQL**: v13.0 or higher
- **npm**: v8.0.0 or higher (comes with Node.js)

### Operating System Support
- Windows 10/11
- macOS 10.15+
- Ubuntu 20.04+ / Debian 10+

## Installation Steps

### 1. System Prerequisites Installation

#### On Windows:
```bash
# Install Node.js from nodejs.org
# Install PostgreSQL from postgresql.org
# Or use chocolatey:
choco install nodejs postgresql
```

#### On macOS:
```bash
# Install Homebrew first if not installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js and PostgreSQL
brew install node postgresql
```

#### On Ubuntu/Debian:
```bash
# Update package list
sudo apt update

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib
```

### 2. Project Setup

```bash
# Create main project directory
mkdir legal-education-platform
cd legal-education-platform

# Create frontend and backend directories
mkdir frontend backend
```

### 3. Backend Dependencies

```bash
cd backend
npm init -y

# Core Backend Dependencies
npm install express@^4.18.2
npm install cors@^2.8.5
npm install helmet@^7.0.0
npm install dotenv@^16.3.1

# Authentication & Security
npm install bcryptjs@^2.4.3
npm install jsonwebtoken@^9.0.2
npm install express-rate-limit@^6.10.0
npm install express-session@^1.17.3

# Database
npm install pg@^8.11.3
npm install connect-pg-simple@^9.0.1

# File Upload
npm install multer@^1.4.5-lts.1
npm install uuid@^9.0.0

# Development Dependencies
npm install -D typescript@^5.2.2
npm install -D @types/node@^20.6.3
npm install -D @types/express@^4.17.17
npm install -D @types/bcryptjs@^2.4.4
npm install -D @types/jsonwebtoken@^9.0.3
npm install -D @types/multer@^1.4.8
npm install -D @types/pg@^8.10.3
npm install -D @types/uuid@^9.0.4
npm install -D @types/express-session@^1.17.7
npm install -D nodemon@^3.0.1
npm install -D ts-node@^10.9.1
```

### 4. Frontend Dependencies

```bash
cd ../frontend
npm init -y

# Core Frontend Dependencies
npm install next@^13.5.4
npm install react@^18.2.0
npm install react-dom@^18.2.0
npm install typescript@^5.2.2

# Styling
npm install tailwindcss@^3.3.4
npm install autoprefixer@^10.4.16
npm install postcss@^8.4.31
npm install @tailwindcss/forms@^0.5.6
npm install @tailwindcss/typography@^0.5.10

# Icons & UI
npm install lucide-react@^0.279.0

# HTTP Client
npm install axios@^1.5.0

# Development Dependencies
npm install -D @types/react@^18.2.22
npm install -D @types/react-dom@^18.2.8
npm install -D @types/node@^20.6.3
```

### 5. Database Setup

```bash
# Start PostgreSQL service
sudo systemctl start postgresql  # Linux
brew services start postgresql   # macOS
# Windows: Start from Services or pgAdmin

# Connect to PostgreSQL and run schema
psql -U postgres
# Then run the schema.sql file contents
```

## Complete Package.json Files

### Backend package.json
```json
{
  "name": "legal-education-backend",
  "version": "1.0.0",
  "main": "src/server.ts",
  "scripts": {
    "dev": "nodemon src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "db:setup": "psql -U postgres -f database/schema.sql"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "multer": "^1.4.5-lts.1",
    "pg": "^8.11.3",
    "uuid": "^9.0.0",
    "dotenv": "^16.3.1",
    "express-rate-limit": "^6.10.0",
    "express-session": "^1.17.3",
    "connect-pg-simple": "^9.0.1"
  },
  "devDependencies": {
    "@types/express": "^4.17.17",
    "@types/bcryptjs": "^2.4.4",
    "@types/jsonwebtoken": "^9.0.3",
    "@types/multer": "^1.4.8",
    "@types/pg": "^8.10.3",
    "@types/uuid": "^9.0.4",
    "@types/express-session": "^1.17.7",
    "nodemon": "^3.0.1",
    "ts-node": "^10.9.1",
    "typescript": "^5.2.2"
  }
}
```

### Frontend package.json
```json
{
  "name": "legal-education-frontend",
  "version": "1.0.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "^13.5.4",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "typescript": "^5.2.2",
    "tailwindcss": "^3.3.4",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.31",
    "@tailwindcss/forms": "^0.5.6",
    "@tailwindcss/typography": "^0.5.10",
    "lucide-react": "^0.279.0",
    "axios": "^1.5.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.22",
    "@types/react-dom": "^18.2.8",
    "@types/node": "^20.6.3"
  }
}
```

## Environment Configuration

### Backend .env
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=legal_education
DB_USER=postgres
DB_PASSWORD=your_password

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-2025
SESSION_SECRET=your-super-secret-session-key-change-this-in-production-2025

# Server Configuration
PORT=5000
NODE_ENV=development

# Upload Configuration
UPLOAD_DIR=uploads
MAX_FILE_SIZE=500000000
```

### Frontend .env.local
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXTAUTH_URL=http://localhost:3000
```

## Quick Start Commands

### First Time Setup
```bash
# 1. Clone/setup project
git clone <repository-url>
cd legal-education-platform

# 2. Install backend dependencies
cd backend
npm install

# 3. Install frontend dependencies
cd ../frontend
npm install

# 4. Setup database
cd ../backend
npm run db:setup

# 5. Start development servers
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### Daily Development
```bash
# Start backend (Terminal 1)
cd backend && npm run dev

# Start frontend (Terminal 2)
cd frontend && npm run dev
```

## Production Build

### Backend
```bash
cd backend
npm run build
npm start
```

### Frontend
```bash
cd frontend
npm run build
npm start
```

## Troubleshooting

### Common Issues

1. **PostgreSQL Connection Issues**
   ```bash
   # Check if PostgreSQL is running
   sudo systemctl status postgresql  # Linux
   brew services list | grep postgres  # macOS
   
   # Reset PostgreSQL password
   sudo -u postgres psql
   ALTER USER postgres PASSWORD 'newpassword';
   ```

2. **Node.js Version Issues**
   ```bash
   # Check Node.js version
   node --version
   
   # Update Node.js
   # Use nvm for version management
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   nvm install 18
   nvm use 18
   ```

3. **Port Already in Use**
   ```bash
   # Find process using port 5000
   lsof -i :5000  # macOS/Linux
   netstat -ano | findstr :5000  # Windows
   
   # Kill process
   kill -9 <PID>  # macOS/Linux
   taskkill /PID <PID> /F  # Windows
   ```

## Development Team Notes

### Project Structure
- **Separated Frontend/Backend**: Clean separation for scalability
- **TypeScript**: Full TypeScript support across the stack
- **Multi-session Support**: Users can login from multiple devices
- **Secure Video Streaming**: Protected endpoints for video content
- **Admin-controlled Users**: No self-registration, admin creates accounts

### Default Admin Credentials
- **Email**: admin@cliniquedujuriste.com
- **Password**: admin123
- **Note**: Change these in production!

### Video Upload Limits
- **Max File Size**: 500MB per video
- **Supported Formats**: All video/* MIME types
- **Storage**: Local filesystem in uploads/videos/

### Security Features
- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: bcrypt with salt rounds of 12
- **Rate Limiting**: API endpoint protection
- **CORS**: Configured for frontend domain
- **Helmet**: Security headers middleware