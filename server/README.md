# Server

Backend API server built with Express.js, Prisma, and Convex.

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database and Convex configuration

# Full development setup (recommended)
npm run dev:full
```

## Available Scripts

### Development

- `npm run dev` - Build TypeScript and start server
- `npm run dev:full` - Complete setup: generate Prisma client, build, and setup Convex
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Start production server

### Database (Prisma)

- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema changes to database
- `npm run db:migrate` - Create and run database migrations
- `npm run db:studio` - Open Prisma Studio (database GUI)

### Convex (Real-time Database)

- `npm run convex:clean` - Clean generated Convex files (fixes conflicts)
- `npm run convex:dev` - Start Convex development server with cleanup
- `npm run convex:dev:once` - Run Convex setup once with cleanup
- `npm run convex:deploy` - Deploy Convex functions to production

### Code Formatting & Quality

- `npm run format` - Format all files with Prettier
- `npm run format:check` - Check if files are properly formatted
- `npm run format:src` - Format only source files (src directory)
- `npm run format:convex` - Format only Convex files
- `npm run lint` - Check formatting and build (no fixes)
- `npm run precommit` - Format, build, and setup Convex (recommended before commits)

## API Endpoints

### Authentication Routes (`/api/v1/auth`)

**Public Routes:**

- `POST /register` - User registration
- `POST /login` - User login
- `POST /refresh` - Refresh access token (requires valid refresh token)

**Protected Routes:**

- `GET /me` - Get user profile (requires auth)
- `PATCH /update` - Update user profile (requires auth)
- `DELETE /delete` - Delete user account (requires auth)
- `POST /logout` - Logout user (enhanced security)

### Newsletter Routes (`/api/v1/news`)

**Public Routes:**

- `GET /` - Get all newsletters (optional auth for enhanced data)
- `GET /:id` - Get newsletter by ID (optional auth for enhanced data)

**Protected Routes:**

- `POST /` - Create newsletter (ADMIN/SUBCOMMITTEE only)
- `PATCH /:id` - Update newsletter (ADMIN/SUBCOMMITTEE only)
- `DELETE /:id` - Delete newsletter (ADMIN only)

## Security Features

### Authentication & Authorization

**Enhanced Security Model:**

- **Dual Token Requirement**: Both access and refresh tokens must be present for protected routes
- **Session Validation**: Active session verification for enhanced security
- **Role-Based Access Control**: Granular permissions (USER, ADMIN, SUBCOMMITTEE)
- **Token Rotation**: Automatic token refresh with session rotation
- **Secure Logout**: Invalidates all user sessions on logout

**Route Protection Levels:**

- **Public Routes**: No authentication required (`/register`, `/login`)
- **Optional Auth**: Works with or without authentication (`GET /newsletters`)
- **Protected Routes**: Requires both access and refresh tokens (`/me`, `/update`)
- **Role-Based Routes**: Requires specific roles (`POST /newsletters` - ADMIN/SUBCOMMITTEE only)

**Security Middleware:**

- `verifyAuth`: Requires both access and refresh tokens
- `optionalAuth`: Optional authentication for public routes
- `requireRole(roles)`: Role-based access control
- `validateSession`: Session validation middleware
- `secureAuth`: Combined auth + session validation

### API Security

**Token Management:**

- Access tokens expire in 15 minutes
- Refresh tokens expire in 30 days
- Automatic token rotation on refresh
- Secure HTTP-only cookies

**Error Codes:**

- `MISSING_ACCESS_TOKEN`: Access token not provided
- `MISSING_REFRESH_TOKEN`: Refresh token not provided
- `INVALID_ACCESS_TOKEN`: Token is invalid or expired
- `SESSION_INVALID`: Session validation failed
- `AUTH_REQUIRED`: Authentication required for this action
- `INSUFFICIENT_PRIVILEGES`: User lacks required permissions

## Troubleshooting

### Convex File Conflicts

If you encounter errors like "Two output files share the same path", use:

```bash
npm run convex:dev:once
```

This automatically cleans up conflicting generated files before running Convex.

### Convex Connection Issues

If you get HTTP 404 errors when syncing to Convex:

1. Make sure your `CONVEX_URL` in `.env` matches your deployment:

   ```bash
   npm run convex:deploy
   # Copy the URL from the output to your .env file
   ```

2. Ensure Convex functions are deployed:
   ```bash
   npm run convex:deploy
   ```

### Database Issues

If Prisma can't find the schema:

```bash
npm run db:generate
```

## Environment Variables

Required in `.env`:

- `DATABASE_URL` - PostgreSQL connection string
- `CONVEX_URL` - Your Convex deployment URL (get from `convex deploy`)
- `CONVEX_ADMIN_KEY` - Convex admin key for server operations (optional for now)
- `ACCESS_SECRET` - JWT access token secret
- `REFRESH_SECRET` - JWT refresh token secret

**Note**: Make sure your `CONVEX_URL` matches your actual deployment URL from `convex deploy`.

## Code Formatting

This project uses Prettier for consistent code formatting. Configuration is in `.prettierrc`:

- **Semi-colons**: Required
- **Quotes**: Double quotes
- **Print width**: 80 characters
- **Tab width**: 2 spaces
- **Trailing commas**: ES5 compatible

Files excluded from formatting (see `.prettierignore`):

- Generated files (`dist/`, `convex/_generated/`, etc.)
- Dependencies (`node_modules/`)
- Environment files (`.env*`)
- Build artifacts

## Project Structure

```
server/
├── src/                 # TypeScript source code
│   ├── controller/      # Route controllers
│   ├── libs/           # Utility libraries (DB, Convex, etc.)
│   ├── middleware/     # Express middleware
│   ├── services/       # Business logic
│   └── utils/          # Helper functions
├── convex/             # Convex database functions
│   ├── schema.ts       # Database schema
│   ├── userActions.ts  # User management actions
│   └── userQueries.ts  # User query functions
├── prisma/             # Prisma database configuration
│   └── schema.prisma   # Database schema
└── dist/               # Compiled JavaScript (generated)
```
