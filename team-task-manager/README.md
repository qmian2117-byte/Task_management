# Team Task Manager

A full-stack collaborative task management application built with Node.js, Express, MySQL, and modern web technologies.

## Features

### Authentication & Security
- ✅ Secure user registration and login
- ✅ Password hashing with bcrypt
- ✅ Session management with MySQL storage
- ✅ HTTP-only cookies
- ✅ Protected API routes
- ✅ Input validation and sanitization

### Team Management
- ✅ Create and manage teams
- ✅ Add/remove team members
- ✅ Role-based access control (Owner, Admin, Member)
- ✅ Team information and member lists

### Task Management
- ✅ Create, update, and delete tasks
- ✅ Assign tasks to team members
- ✅ Set task priority (Low, Medium, High, Urgent)
- ✅ Track task status (To Do, In Progress, Review, Completed)
- ✅ Set due dates
- ✅ Search and filter tasks
- ✅ Filter by team, status, priority, and assignee

### Modern UI
- ✅ Beautiful glassmorphism design
- ✅ Responsive layout (mobile, tablet, desktop)
- ✅ Smooth animations and transitions
- ✅ Tailwind CSS styling
- ✅ Interactive modals
- ✅ Real-time notifications

## Technology Stack

**Backend:**
- Node.js + Express
- MySQL database
- Passport.js (Local Strategy)
- Express Session with MySQL store
- bcrypt for password hashing
- express-validator for input validation

**Frontend:**
- HTML5
- Tailwind CSS
- Vanilla JavaScript
- Font Awesome icons
- Google Fonts (Inter)

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MySQL (v5.7 or higher)
- npm or yarn

### Setup Steps

1. **Clone or navigate to the project directory**
   ```bash
   cd team-task-manager
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up MySQL database**
   - Create a new database:
     ```sql
     CREATE DATABASE team_task_manager;
     ```
   - Import the schema:
     ```bash
     mysql -u root -p team_task_manager < database.sql
     ```

4. **Configure environment variables**
   - Copy `.env.example` to `.env`:
     ```bash
     copy .env.example .env
     ```
   - Update the `.env` file with your configuration:
     ```env
     PORT=3000
     DB_HOST=localhost
     DB_USER=root
     DB_PASSWORD=your_mysql_password
     DB_NAME=team_task_manager
     SESSION_SECRET=your_random_secret_key
     ```

5. **Start the server**
   ```bash
   npm start
   ```

6. **Access the application**
   - Open your browser and navigate to: `http://localhost:3000`

## Usage

### Getting Started

1. **Register a new account**
   - Click "Sign Up" on the login page
   - Enter username, email, and password
   - Click "Sign Up" to create your account

2. **Login**
   - Enter your username and password
   - Click "Sign In"

3. **Create a team**
   - Click "Create Team" button
   - Enter team name and optional description
   - You'll be added as the team owner

4. **Add team members**
   - Click on a team card
   - Click "Add Member"
   - Enter the username of the person to add
   - Select their role (Admin or Member)

5. **Create tasks**
   - Click "Create Task" button
   - Fill in task details (title, description, team, assignee, priority, status, due date)
   - Click "Create Task"

6. **Manage tasks**
   - Click on a task card to view details
   - Edit task information
   - Update task status
   - Delete tasks

7. **Filter and search**
   - Use the search bar to find tasks by title or description
   - Filter by team, status, or priority
   - Combine filters for precise results

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user info

### Teams
- `GET /api/teams` - Get all teams for current user
- `POST /api/teams` - Create new team
- `GET /api/teams/:id` - Get team details
- `PUT /api/teams/:id` - Update team
- `DELETE /api/teams/:id` - Delete team
- `GET /api/teams/:id/members` - Get team members
- `POST /api/teams/:id/members` - Add member to team
- `DELETE /api/teams/:id/members/:userId` - Remove member from team

### Tasks
- `GET /api/tasks` - Get tasks (with optional filters)
- `POST /api/tasks` - Create new task
- `GET /api/tasks/:id` - Get task details
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `PATCH /api/tasks/:id/status` - Update task status

## Security Features

- **Password Security**: All passwords are hashed using bcrypt with salt rounds
- **Session Security**: Sessions stored in MySQL with HTTP-only cookies
- **Input Validation**: All user inputs are validated and sanitized
- **SQL Injection Prevention**: Parameterized queries using mysql2
- **Authentication Middleware**: Protected routes require authentication
- **Role-Based Access**: Team owners and admins have elevated permissions

## Project Structure

```
team-task-manager/
├── config/
│   ├── database.js      # Database connection
│   └── passport.js      # Passport configuration
├── middleware/
│   └── auth.js          # Authentication middleware
├── routes/
│   ├── auth.js          # Authentication routes
│   ├── teams.js         # Team management routes
│   └── tasks.js         # Task management routes
├── public/
│   ├── css/
│   │   └── style.css    # Custom styles
│   ├── js/
│   │   ├── api.js       # API helper functions
│   │   ├── auth.js      # Authentication logic
│   │   ├── dashboard.js # Dashboard logic
│   │   ├── teams.js     # Team management
│   │   └── tasks.js     # Task management
│   └── index.html       # Main HTML file
├── .env                 # Environment variables (create from .env.example)
├── .env.example         # Environment variables template
├── .gitignore          # Git ignore file
├── database.sql        # Database schema
├── package.json        # Dependencies
├── server.js           # Main server file
└── README.md           # This file
```

## Development

To run in development mode:
```bash
npm run dev
```

## Troubleshooting

**Database connection failed:**
- Verify MySQL is running
- Check database credentials in `.env`
- Ensure database exists and schema is imported

**Session issues:**
- Clear browser cookies
- Check SESSION_SECRET in `.env`
- Verify sessions table exists in database

**Port already in use:**
- Change PORT in `.env` file
- Or stop the process using port 3000

## License

ISC

## Author

Team Task Manager Development Team
