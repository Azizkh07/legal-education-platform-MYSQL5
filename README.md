# Legal Education Platform

A modern web platform for legal education, designed to help students and instructors manage courses, subjects, educational videos, and blog articles.  
Built with **Node.js**, **Express**, **TypeScript**, **React**, **Tailwind CSS**, and **PostgreSQL**.

---

## Features

- **Course Management**: Create, edit, view, and delete courses
- **Subject Management**: Organize subjects under courses; assign professors and hours
- **Video Library**: Attach videos to subjects, track video metadata
- **Blog Management**: Write, edit, and publish blog articles for announcements and education
- **Admin Dashboard**: View stats, manage users, courses, subjects, videos, and blog posts
- **User Authentication**: Secure login, JWT-based API access, admin controls
- **Modern Frontend**: Responsive UI built with React, TypeScript, and Tailwind CSS

---

## Project Structure

```
backend/
  ├─ src/
  │   ├─ routes/
  │   │   ├─ courses.ts
  │   │   ├─ subjects.ts
  │   │   ├─ videos.ts
  │   │   └─ blog.ts
  │   ├─ database.ts
  │   ├─ middleware/
  │   │   └─ auth.ts
  │   └─ server.ts
  ├─ uploads/
  └─ ...
frontend/
  └─ src/
      └─ components/
          └─ admin/
              ├─ CourseManagement.tsx
              ├─ CourseForm.tsx
              ├─ VideoManagement.tsx
              ├─ BlogManagement.tsx
              └─ Dashboard.tsx
      └─ App.tsx
      └─ index.tsx
      └─ styles/
          └─ tailwind.css
```
## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 13+
- npm or yarn

## License

MIT

## Author

Azizkh07

