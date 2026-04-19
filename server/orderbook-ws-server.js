import { WebSocketServer } from 'ws'

const PORT = process.env.PORT || 8080
const UPDATE_INTERVAL = 500 // ms

// Price level: [price, size]
class OrderbookWebSocketServer {
  constructor() {
    this.wss = new WebSocketServer({ port: PORT })
    this.clients = new Set()
    this.sequence = 0
    this.basePrice = 50000
    this.bids = new Map()
    this.asks = new Map()
    this.intervalId = null

    this.setupServer()
    this.initializeOrderbook()
  }

  setupServer() {
    this.wss.on('connection', (ws) => {
      console.log('New client connected')
      this.clients.add(ws)

      // Send initial snapshot
      this.sendSnapshot(ws)

      ws.on('close', () => {
        console.log('Client disconnected')
        this.clients.delete(ws)
      })

      ws.on('error', (error) => {
        console.error('WebSocket error:', error)
        this.clients.delete(ws)
      })

      // Handle client messages (e.g., subscription requests)
      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message.toString())
          this.handleMessage(ws, data)
        } catch (error) {
          console.error('Error parsing message:', error)
        }
      })
    })

    console.log(`Orderbook WebSocket server running on ws://localhost:${PORT}`)
  }

  handleMessage(ws, data) {
    switch (data.type) {
      case 'subscribe':
        // Client subscribes to orderbook updates
        console.log('Client subscribed to orderbook')
        this.sendSnapshot(ws)
        break
      case 'ping':
        // Respond to ping with pong
        ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }))
        break
      default:
        console.log('Unknown message type:', data.type)
    }
  }

  initializeOrderbook() {
    const currentPrice = this.getCurrentPrice()
    const bids = this.generatePriceLevels(20, currentPrice, true)
    const asks = this.generatePriceLevels(20, currentPrice, false)

    this.bids = new Map(bids)
    this.asks = new Map(asks)

    // Start broadcasting updates
    this.startBroadcasting()
  }

  generatePriceLevels(count, basePrice, isBid) {
    const levels = []
    const priceStep = basePrice * 0.001 // 0.1% price steps
    const maxAmount = 10
    const minAmount = 0.1

    for (let i = 0; i < count; i++) {
      const priceOffset = isBid ? -i * priceStep : i * priceStep
      const price = basePrice + priceOffset + (Math.random() - 0.5) * priceStep * 0.5
      const amount = Math.random() * (maxAmount - minAmount) + minAmount

      levels.push([
        Math.round(price * 100) / 100,
        Math.round(amount * 1000) / 1000,
      ])
    }

    return levels
  }

  getCurrentPrice() {
    const time = Date.now()
    const variation = Math.sin(time / 10000) * 500 + Math.cos(time / 5000) * 300
    return this.basePrice + variation
  }

  generateDelta() {
    this.sequence += 1
    const currentPrice = this.getCurrentPrice()
    const delta = {
      sequence: this.sequence,
      bids: [],
      asks: [],
    }

    // Randomly update 2-5 price levels
    const numUpdates = Math.floor(Math.random() * 4) + 2

    for (let i = 0; i < numUpdates; i++) {
      const isBid = Math.random() > 0.5
      const priceOffset = (Math.random() - 0.5) * currentPrice * 0.002
      const price = Math.round((currentPrice + priceOffset) * 100) / 100
      const size = Math.random() > 0.1 ? Math.round((Math.random() * 5 + 0.1) * 1000) / 1000 : 0

      if (isBid) {
        delta.bids.push([price, size])
        if (size === 0) {
          this.bids.delete(price)
        } else {
          this.bids.set(price, size)
        }
      } else {
        delta.asks.push([price, size])
        if (size === 0) {
          this.asks.delete(price)
        } else {
          this.asks.set(price, size)
        }
      }
    }

    return delta
  }

  generateSnapshot() {
    this.sequence += 1
    const currentPrice = this.getCurrentPrice()
    const bids = this.generatePriceLevels(20, currentPrice, true)
    const asks = this.generatePriceLevels(20, currentPrice, false)

    this.bids = new Map(bids)
    this.asks = new Map(asks)

    return {
      sequence: this.sequence,
      bids,
      asks,
    }
  }

  sendSnapshot(ws) {
    const snapshot = this.generateSnapshot()
    const message = {
      type: 'snapshot',
      ...snapshot,
      timestamp: Date.now(),
    }
    this.send(ws, message)
  }

  send(ws, message) {
    if (ws.readyState === 1) {
      // WebSocket.OPEN
      try {
        ws.send(JSON.stringify(message))
      } catch (error) {
        console.error('Error sending message:', error)
      }
    }
  }

  broadcast(message) {
    const data = JSON.stringify(message)
    this.clients.forEach((client) => {
      if (client.readyState === 1) {
        // WebSocket.OPEN
        try {
          client.send(data)
        } catch (error) {
          console.error('Error broadcasting to client:', error)
          this.clients.delete(client)
        }
      }
    })
  }

  startBroadcasting() {
    if (this.intervalId) {
      return
    }

    // Send initial snapshot to all clients
    const snapshot = this.generateSnapshot()
    this.broadcast({
      type: 'snapshot',
      ...snapshot,
      timestamp: Date.now(),
    })

    // Then send delta updates
    this.intervalId = setInterval(() => {
      const delta = this.generateDelta()
      this.broadcast({
        type: 'delta',
        ...delta,
        timestamp: Date.now(),
      })
    }, UPDATE_INTERVAL)
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    this.wss.close()
  }
}

// Start the server
const server = new OrderbookWebSocketServer()

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down server...')
  server.stop()
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.log('\nShutting down server...')
  server.stop()
  process.exit(0)
})

