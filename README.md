# Pastebin-Lite

A simple pastebin application built with Next.js that allows users to create text pastes with optional time-to-live (TTL) and view count limits.

## Project Description

Pastebin-Lite is a lightweight pastebin service where users can:
- Create text pastes with optional constraints (TTL and max views)
- Share pastes via unique URLs
- View pastes in a clean, readable format
- Have pastes automatically expire based on constraints

## How to Run Locally

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd pastebin-lite
```

2. Install dependencies:
```bash
npm install
```

3. (Optional) Set up Vercel KV for persistence:
   - For local development, the app uses an in-memory fallback store
   - For production, configure Vercel KV by setting environment variables:
     - `KV_REST_API_URL`
     - `KV_REST_API_TOKEN`
   - These are automatically configured when deploying to Vercel

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### Building for Production

```bash
npm run build
npm start
```

## Persistence Layer

**Vercel KV** is used as the primary persistence layer for production deployments. Vercel KV is a Redis-compatible key-value store that works seamlessly with Vercel's serverless platform.

### Local Development
For local development, the application uses an in-memory fallback store (Map-based) when Vercel KV is not configured. This allows the app to run locally without requiring KV setup, but data will not persist between server restarts.

### Production
When deployed to Vercel with KV configured, the application automatically uses Vercel KV for persistent storage. The KV store persists data across serverless function invocations, ensuring pastes are available even after cold starts.

### Data Structure
Pastes are stored with the key format: `paste:<id>` where `<id>` is a randomly generated unique identifier. Each paste contains:
- `id`: Unique identifier
- `content`: The paste content
- `createdAt`: Timestamp of creation (milliseconds since epoch)
- `ttlSeconds`: Optional time-to-live in seconds
- `maxViews`: Optional maximum view count
- `views`: Current view count

## Important Design Decisions

### 1. View Count Increment Logic
View counts are incremented **after** checking if the paste is available. This ensures that:
- A paste with `max_views: 1` can be viewed once (views go from 0 to 1)
- The view is counted when the content is successfully retrieved
- The next request will correctly see views >= maxViews and return 404

### 2. Test Mode Support
The application supports deterministic time testing via the `TEST_MODE` environment variable and `x-test-now-ms` header:
- When `TEST_MODE=1` is set, the application uses the `x-test-now-ms` header value as the current time
- This allows automated tests to control time progression for TTL testing
- The header is only used for expiry logic, not for other time-based operations

### 3. HTML Escaping
All paste content is properly escaped when rendered in HTML to prevent XSS attacks. The content is displayed in a `<pre>`-like format with proper whitespace preservation.

### 4. Error Handling
- All API endpoints return JSON responses with appropriate HTTP status codes
- Invalid inputs return 400 with descriptive error messages
- Unavailable pastes (expired, view limit exceeded, or not found) return 404
- All errors include JSON error bodies for consistency

### 5. Serverless Compatibility
The application is designed to work in serverless environments:
- No global mutable state that could break across requests
- Stateless API routes
- Proper use of Vercel KV for cross-request persistence

### 6. API Response Format
- Health check returns `{ ok: boolean }` indicating KV availability
- Paste creation returns `{ id: string, url: string }`
- Paste retrieval returns `{ content: string, remaining_views: number | null, expires_at: string | null }`
- All timestamps are in ISO 8601 format

## API Endpoints

### `GET /api/healthz`
Health check endpoint that returns the application status and KV availability.

### `POST /api/pastes`
Creates a new paste. Request body:
```json
{
  "content": "string (required)",
  "ttl_seconds": 60 (optional, integer >= 1),
  "max_views": 5 (optional, integer >= 1)
}
```

### `GET /api/pastes/:id`
Retrieves a paste by ID. Returns the content, remaining views, and expiry time.

### `GET /p/:id`
HTML view of a paste. Safely renders the content with proper escaping.

## Testing

The application supports deterministic time testing. Set `TEST_MODE=1` and include the `x-test-now-ms` header in requests to control time for TTL testing.

Example:
```bash
curl -H "x-test-now-ms: 1000000000000" http://localhost:3000/api/pastes/abc123
```

## Deployment

### Deploy to Vercel

1. Push your code to a Git repository
2. Import the project in Vercel
3. Vercel will automatically detect Next.js and configure the build
4. Add Vercel KV to your project in the Vercel dashboard
5. Environment variables for KV will be automatically configured

The application will be available at `https://your-app.vercel.app`

## Repository Structure

```
pastebin-lite/
├── app/
│   ├── api/
│   │   ├── healthz/
│   │   │   └── route.ts          # Health check endpoint
│   │   └── pastes/
│   │       ├── route.ts          # POST /api/pastes
│   │       └── [id]/
│   │           └── route.ts      # GET /api/pastes/:id
│   ├── p/
│   │   └── [id]/
│   │       ├── page.tsx          # GET /p/:id (HTML view)
│   │       └── not-found.tsx     # 404 page for pastes
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Home page (paste creation UI)
│   └── globals.css               # Global styles
├── lib/
│   ├── kv.ts                     # KV connection and fallback
│   ├── types.ts                  # TypeScript type definitions
│   └── utils.ts                  # Utility functions
├── package.json
├── tsconfig.json
└── README.md
```

## License

This project is created for a take-home assignment.
