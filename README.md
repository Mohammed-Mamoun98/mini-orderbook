# Orderbook DEX

Real-time orderbook visualization for a decentralized exchange. Displays live bid/ask price levels with depth charts, spread tracking, and sequence-based update handling with automatic gap detection.

## Features

- Real-time orderbook updates via WebSocket (with mock data server)
- Efficient Map-based price level storage
- Sequence-based delta updates with automatic gap detection
- Snapshot fallback when sequence gaps are detected
- Spread calculation and display
- Depth visualization with cumulative totals
- Exponential backoff reconnection for WebSocket clients

## Tech Stack

| Layer | Technology |
| --- | --- |
| UI | React 19, TypeScript, Tailwind CSS |
| Routing | TanStack Router (file-based) |
| State | Zustand |
| Build | Vite |
| Linting | Biome |
| Server | Node.js, `ws` (WebSocket) |

## Getting Started

### Install dependencies

```bash
pnpm install
```

### Run the development server

```bash
pnpm dev
```

The app runs on `http://localhost:3000`.

### Run the WebSocket server

```bash
pnpm server
```

The WebSocket server runs on `ws://localhost:8080`. Visit the `/ws` route in the app to connect, subscribe, and inspect raw messages.

## Project Structure

```
├── server/                     # WebSocket orderbook server
│   ├── orderbook-ws-server.js  # WS server with snapshot/delta broadcasts
│   └── example-client.js       # Example WS client
├── src/
│   ├── components/             # UI components
│   │   ├── Orderbook.tsx       # Main orderbook view
│   │   ├── OrderRow.tsx        # Single price level row
│   │   ├── Spread.tsx          # Spread display
│   │   ├── Header.tsx         # App header
│   │   └── Layout.tsx         # Page layout
│   ├── routes/                 # TanStack Router file-based routes
│   │   ├── __root.tsx          # Root layout
│   │   ├── index.tsx           # Home — live orderbook (mock)
│   │   ├── ws.tsx             # WebSocket connection playground
│   │   └── about.tsx          # About page
│   ├── services/
│   │   └── mockOrderbookServer.ts  # Client-side mock server
│   ├── store/
│   │   └── orderbookStore.ts  # Zustand store with snapshot/delta logic
│   └── main.tsx               # App entry point
```

## How It Works

1. **Initial Snapshot** — On connect, the server sends a full snapshot of all bid/ask price levels.
2. **Delta Updates** — Subsequent updates contain only changed price levels, each tagged with a sequence number.
3. **Gap Detection** — If a sequence gap is detected, the store automatically treats the next update as a snapshot to resynchronize.

## Available Scripts

```bash
pnpm dev       # Start Vite dev server
pnpm build     # Production build + type check
pnpm preview   # Preview production build
pnpm server    # Start WebSocket server
pnpm test      # Run tests (Vitest)
pnpm lint      # Lint with Biome
pnpm format    # Format with Biome
pnpm check     # Lint + format check
```
