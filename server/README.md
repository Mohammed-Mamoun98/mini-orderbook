# Orderbook WebSocket Server

A standalone WebSocket server that emits orderbook data in a standard format, similar to how real cryptocurrency exchanges work.

## Features

- **Standard WebSocket Protocol**: Uses WebSocket for real-time communication
- **Sequence-based Updates**: Each update includes a sequence number for tracking
- **Snapshot & Delta Updates**: 
  - Initial connection sends a full snapshot
  - Subsequent updates are deltas (only changed price levels)
- **Automatic Gap Detection**: Clients can detect missing sequences and request resync
- **Realistic Market Simulation**: Simulates price movements and order updates

## Installation

```bash
npm install ws
```

Or if using the project's package.json:

```bash
npm install
```

## Running the Server

Using npm script:
```bash
npm run server
```

Or directly:
```bash
node server/orderbook-ws-server.js
```

Or with environment variables:

```bash
PORT=3001 node server/orderbook-ws-server.js
```

The server will start on `ws://localhost:8080` by default.

## Testing

### Browser Test (Recommended)
Open `server/test.html` in your browser for a visual WebSocket client with:
- Real-time orderbook visualization
- Message log
- Sequence gap detection
- Connection status

### Node.js Test Client
Run the example client:
```bash
node server/example-client.js
```

This will connect to the server and log all messages to the console, including sequence gap detection.

## Message Format

### Snapshot Message (Initial Update)

```json
{
  "type": "snapshot",
  "sequence": 1,
  "bids": [[50000.50, 5.234], [49999.75, 3.456], ...],
  "asks": [[50001.25, 2.123], [50002.00, 4.567], ...],
  "timestamp": 1234567890123
}
```

### Delta Message (Incremental Updates)

```json
{
  "type": "delta",
  "sequence": 2,
  "bids": [[50000.50, 6.789], [49999.00, 0]],  // size 0 means delete
  "asks": [[50001.25, 3.456]],
  "timestamp": 1234567890124
}
```

### Client Messages

**Subscribe:**
```json
{
  "type": "subscribe"
}
```

**Ping:**
```json
{
  "type": "ping"
}
```

**Pong Response:**
```json
{
  "type": "pong",
  "timestamp": 1234567890123
}
```

## Price Level Format

Each price level is an array `[price, size]`:
- `price`: Number - The price level
- `size`: Number - The order size at that price (0 means delete/remove)

## Sequence Numbers

- Each update has a sequential number
- Clients should track the last received sequence
- If `currentSequence !== lastSequence + 1`, a gap was detected
- On gap detection, clients should request a new snapshot

## Example Client Connection

```javascript
const ws = new WebSocket('ws://localhost:8080')

ws.onopen = () => {
  // Subscribe to orderbook updates
  ws.send(JSON.stringify({ type: 'subscribe' }))
}

ws.onmessage = (event) => {
  const data = JSON.parse(event.data)
  
  if (data.type === 'snapshot') {
    // Handle full snapshot
    console.log('Snapshot:', data)
  } else if (data.type === 'delta') {
    // Handle delta update
    console.log('Delta:', data)
  }
}
```

## Integration with Frontend

To connect from the React app, update the mock server to use WebSocket instead of intervals:

```javascript
const ws = new WebSocket('ws://localhost:8080')
ws.send(JSON.stringify({ type: 'subscribe' }))
ws.onmessage = (event) => {
  const update = JSON.parse(event.data)
  // Apply update to orderbook store
}
```

