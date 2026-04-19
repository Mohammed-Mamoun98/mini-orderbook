/**
 * Example WebSocket client for testing the orderbook server
 * Run: node server/example-client.js
 */

import WebSocket from 'ws'

const WS_URL = process.env.WS_URL || 'ws://localhost:8080'

let lastSequence = null
let messageCount = 0

const ws = new WebSocket(WS_URL)

ws.on('open', () => {
  console.log('✅ Connected to orderbook server')
  
  // Subscribe to orderbook updates
  ws.send(JSON.stringify({ type: 'subscribe' }))
  console.log('📤 Sent subscription request')
})

ws.on('message', (data) => {
  try {
    const message = JSON.parse(data.toString())
    messageCount++

    if (message.type === 'snapshot') {
      console.log(`\n📸 Snapshot #${message.sequence}:`)
      console.log(`   Bids: ${message.bids.length} levels`)
      console.log(`   Asks: ${message.asks.length} levels`)
      console.log(`   Best Bid: ${message.bids[0]?.[0] || 'N/A'}`)
      console.log(`   Best Ask: ${message.asks[0]?.[0] || 'N/A'}`)
      lastSequence = message.sequence
    } else if (message.type === 'delta') {
      // Check for sequence gaps
      if (lastSequence !== null && message.sequence !== lastSequence + 1) {
        console.log(`\n⚠️  SEQUENCE GAP DETECTED!`)
        console.log(`   Expected: ${lastSequence + 1}, Got: ${message.sequence}`)
        console.log(`   Missing ${message.sequence - lastSequence - 1} updates`)
      }

      console.log(`\n🔄 Delta #${message.sequence}:`)
      console.log(`   Bid updates: ${message.bids.length}`)
      console.log(`   Ask updates: ${message.asks.length}`)
      
      if (message.bids.length > 0) {
        console.log(`   Bid changes:`, message.bids.slice(0, 3))
      }
      if (message.asks.length > 0) {
        console.log(`   Ask changes:`, message.asks.slice(0, 3))
      }

      lastSequence = message.sequence
    } else if (message.type === 'pong') {
      console.log('🏓 Pong received')
    }

    // Show stats every 10 messages
    if (messageCount % 10 === 0) {
      console.log(`\n📊 Stats: ${messageCount} messages received, last sequence: ${lastSequence}`)
    }
  } catch (error) {
    console.error('❌ Error parsing message:', error)
  }
})

ws.on('error', (error) => {
  console.error('❌ WebSocket error:', error.message)
})

ws.on('close', () => {
  console.log('\n👋 Disconnected from server')
  console.log(`📊 Total messages received: ${messageCount}`)
  process.exit(0)
})

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Closing connection...')
  ws.close()
})

// Send ping every 30 seconds to keep connection alive
setInterval(() => {
  if (ws.readyState === 1) { // WebSocket.OPEN
    ws.send(JSON.stringify({ type: 'ping' }))
  }
}, 30000)

