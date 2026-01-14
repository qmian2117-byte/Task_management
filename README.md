# Team Task Manager

A full-stack web application for team collaboration and task management with secure authentication, team creation, member management, and task assignment features.

## Features

- **User Authentication**: Secure registration and login with PassportJS and Express Session
- **Team Management**: Create teams, add/remove members, role-based access control
- **Task Management**: Create, assign, update, and delete tasks within teams
- **Advanced Filtering**: Filter tasks by team, assignee, status, and search by title
- **Due Date Reminders**: Automatic notifications for tasks due within 24 hours
- **Responsive Design**: Clean, mobile-friendly UI built with Tailwind CSS

## Technology Stack

### Backend
- Node.js + Express
- MySQL with Knex.js query builder
- PassportJS + Express Session (MySQL session store)
- bcryptjs for password hashing
- express-validator for input validation

### Frontend
- HTML5, CSS3, JavaScript
- Tailwind CSS for styling
- Fetch API for backend communication

### Database
- MySQL with four tables: users, teams, team_members, tasks

## Prerequisites

- Node.js (v14 or higher)
- MySQL (v5.7 or higher)
- npm or yarn

## Installation

### 1. Clone the repository
```bash
git clone <repository-url>
cd ASSESMENT PROJECT
```

### 2. Set up the database
```bash
# Login to MySQL
mysql -u root -p

# Create the database
CREATE DATABASE team_task_manager;
exit;
```

### 3. Configure environment variables
```bash
# Copy the example env file
cd backend
cp .env.example .env

# Edit .env and update with your MySQL credentials
# DB_HOST=localhost
# DB_USER=root
# DB_PASSWORD=your_password
# DB_NAME=team_task_manager
# SESSION_SECRET=your_secret_key
```

### 4. Install backend dependencies
```bash
cd backend
npm install
```

### 5. Run database migrations
```bash
npm run migrate
```

### 6. Start the backend server
```bash
npm start
# Server will run on http://localhost:5000
```

### 7. Start the frontend (in a new terminal)
```bash
cd frontend
# Using live-server (install globally: npm install -g live-server)
live-server --port=3000

# OR using Python
python -m http.server 3000

# Frontend will run on http://localhost:3000
```

## Usage

### Registration and Login
1. Open http://localhost:3000 in your browser
2. Click "Register" to create a new account
3. Fill in username, email, and password (min 6 characters)
4. After registration, you'll be automatically logged in

### Creating Teams
1. Click "+ New Team" in the Teams sidebar
2. Enter team name and optional description
3. Click "Create Team"

### Adding Team Members
1. Click "Add Member" on a team you created
2. Enter the username or email of the user to add
3. Click "Add Member"

### Creating Tasks
1. Click "+ New Task" button
2. Fill in task details:
   - Title (required)
   - Description (optional)
   - Select team (required)
   - Assign to team member (optional)
   - Set status, priority, and due date
3. Click "Save Task"

### Filtering Tasks
- Use the search box to find tasks by title
- Filter by team using the team dropdown
- Filter by status (Pending, In Progress, Completed)
- Filter by assignee
- Click on a team in the sidebar to view only that team's tasks

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### Teams
- `POST /api/teams` - Create team
- `GET /api/teams` - Get user's teams
- `GET /api/teams/:id` - Get team details
- `POST /api/teams/:id/members` - Add team member
- `DELETE /api/teams/:id/members/:userId` - Remove team member

### Tasks
- `POST /api/tasks` - Create task
- `GET /api/tasks` - Get tasks (with filters)
- `GET /api/tasks/:id` - Get task details
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

## Security Features

- Passwords hashed with bcrypt (10 salt rounds)
- HTTP-only session cookies
- Session stored in MySQL (production) or memory (development)
- Input validation and sanitization
- SQL injection protection via Knex parameterized queries
- Role-based access control for team operations

## Git Workflow

This project demonstrates proper Git workflow with:
- Feature branches for each major component
- Meaningful commit messages
- Separate commits for database, authentication, teams, tasks, and frontend

## Project Structure

```
ASSESMENT PROJECT/
├── backend/
│   ├── config/
│   │   ├── database.js
│   │   └── passport.js
│   ├── middleware/
│   │   └── auth.js
│   ├── migrations/
│   │   ├── 20260114000001_create_users.js
│   │   ├── 20260114000002_create_teams.js
│   │   ├── 20260114000003_create_team_members.js
│   │   └── 20260114000004_create_tasks.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── teams.js
│   │   └── tasks.js
│   ├── .env.example
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── index.html
│   ├── app.js
│   └── styles.css
├── .gitignore
├── knexfile.js
└── README.md
```

## License

MIT

## Author

Team Task Manager - Assessment Project
