# HustConnect - Professional Networking & Job Platform

A full-stack web application built with **Flask** (Python) for the backend and **React** (TypeScript) for the frontend. This project mirrors the core functionality of the original Hustify Programming application.

## 🚀 Features

### Core Features
- **User Authentication** - Sign up, sign in, JWT-based authentication
- **Blog/Feed** - Create posts, like, comment, and share content
- **Job Listings** - Browse jobs, search, filter, and apply
- **Mock Interviews** - AI-powered interview practice (integration ready)
- **User Profiles** - Complete profiles with experience, education, skills, and projects
- **Company Pages** - Company profiles with job listings
- **HR Dashboard** - Dedicated portal for HR to manage job postings

### User Roles
- **Regular Users** - Browse jobs, apply, network, post content
- **HR Users** - Post jobs, manage applications, view analytics
- **Admin** - Full system management

## 📁 Project Structure

```
flask_react_hustconnect/
├── backend/                 # Flask Backend
│   ├── app/
│   │   ├── __init__.py     # Application factory
│   │   ├── models.py       # SQLAlchemy models
│   │   ├── routes/         # API endpoints
│   │   │   ├── auth.py
│   │   │   ├── users.py
│   │   │   ├── jobs.py
│   │   │   ├── blogs.py
│   │   │   ├── companies.py
│   │   │   └── interviews.py
│   │   └── utils/
│   │       └── seed_data.py
│   ├── config.py           # Configuration
│   ├── run.py              # Entry point
│   └── requirements.txt
│
└── frontend/                # React Frontend
    ├── src/
    │   ├── components/     # Reusable components
    │   ├── layouts/        # Page layouts
    │   ├── lib/            # Utilities & API
    │   ├── pages/          # Page components
    │   ├── store/          # Zustand state stores
    │   ├── types/          # TypeScript types
    │   ├── App.tsx
    │   └── main.tsx
    ├── package.json
    ├── tailwind.config.js
    ├── vite.config.ts
    └── tsconfig.json
```

## 🛠️ Tech Stack

### Backend
- **Flask 3.0** - Web framework
- **Flask-SQLAlchemy** - ORM
- **Flask-JWT-Extended** - JWT authentication
- **Flask-CORS** - Cross-origin resource sharing
- **SQLite** - Database (easily switchable to PostgreSQL)
- **Werkzeug** - Password hashing

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite 5** - Build tool
- **TailwindCSS** - Styling
- **React Router 6** - Routing
- **Zustand** - State management
- **React Hook Form + Zod** - Form handling & validation
- **Axios** - HTTP client
- **Lucide React** - Icons

## 🚀 Getting Started

### Prerequisites
- Python 3.9+
- Node.js 18+
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd flask_react_hustconnect/backend
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Copy environment variables:
   ```bash
   cp .env.example .env
   ```

5. Initialize the database:
   ```bash
   flask init-db
   ```

6. (Optional) Seed sample data:
   ```bash
   flask seed-db
   ```

7. Run the development server:
   ```bash
   flask run
   # or
   python run.py
   ```

The backend will be available at `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd flask_react_hustconnect/frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

The frontend will be available at `http://localhost:5173`

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh token
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users/profile` - Get own profile
- `PUT /api/users/profile` - Update profile
- `GET /api/users/:id` - Get user by ID
- `GET /api/users/suggested` - Get suggested connections
- `POST /api/users/:id/connect` - Send connection request

### Jobs
- `GET /api/jobs` - List jobs (with pagination, search, filters)
- `GET /api/jobs/:id` - Get job details
- `POST /api/jobs` - Create job (HR only)
- `PUT /api/jobs/:id` - Update job (HR only)
- `DELETE /api/jobs/:id` - Delete job (HR only)
- `POST /api/jobs/:id/apply` - Apply to job

### Blogs/Posts
- `GET /api/blogs` - List posts
- `GET /api/blogs/:id` - Get post
- `POST /api/blogs` - Create post
- `PUT /api/blogs/:id` - Update post
- `DELETE /api/blogs/:id` - Delete post
- `POST /api/blogs/:id/like` - Like/unlike post
- `POST /api/blogs/:id/comments` - Add comment

### Companies
- `GET /api/companies` - List companies
- `GET /api/companies/:id` - Get company
- `POST /api/companies/:id/follow` - Follow company
- `GET /api/companies/:id/jobs` - Get company jobs

### Interviews
- `GET /api/interviews` - Get user's interviews
- `POST /api/interviews` - Create interview
- `GET /api/interviews/:id` - Get interview details
- `POST /api/interviews/from-job/:jobId` - Create interview from job

## 🎨 Design System

### Colors
- **Primary**: `#BF3131` (Red)
- **Background Light**: `#FFFFFF`
- **Background Dark**: `#0F1117`
- **Card Dark**: `#1A1C20`

### Component Classes
- `.card` - Card container
- `.btn` - Button base
- `.btn-primary` - Primary button
- `.btn-secondary` - Secondary button
- `.btn-ghost` - Ghost button
- `.input` - Form input
- `.badge` - Badge component

## 📝 Environment Variables

### Backend (.env)
```env
FLASK_APP=run.py
FLASK_ENV=development
SECRET_KEY=your-secret-key
JWT_SECRET_KEY=your-jwt-secret-key
DATABASE_URL=sqlite:///hustconnect.db
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

This project is inspired by the original Hustify Programming application, recreated using Flask and React for educational purposes.
