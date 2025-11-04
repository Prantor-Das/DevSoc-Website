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
