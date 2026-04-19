import type { OrderbookUpdate, PriceLevel } from '../store/orderbookStore'

// Mock server that simulates orderbook data updates
class MockOrderbookServer {
  private intervalId: number | null = null
  private basePrice = 50000 // Base price in USD
  private subscribers: Set<(update: OrderbookUpdate) => void> = new Set()
  private currentBids = new Map<number, number>()
  private currentAsks = new Map<number, number>()
  private sequence = 0

  // Generate random price levels
  private generatePriceLevels(count: number, basePrice: number, isBid: boolean): PriceLevel[] {
    const levels: PriceLevel[] = []
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

  // Simulate price movement
  private getCurrentPrice(): number {
    const time = Date.now()
    const variation = Math.sin(time / 10000) * 500 + Math.cos(time / 5000) * 300
    return this.basePrice + variation
  }

  // Generate delta updates (simulate incremental changes)
  private generateDelta(): OrderbookUpdate {
    this.sequence += 1
    const currentPrice = this.getCurrentPrice()
    const delta: OrderbookUpdate = {
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
      const size = Math.random() > 0.1 ? Math.random() * 5 + 0.1 : 0 // 10% chance to delete

      if (isBid) {
        delta.bids.push([price, Math.round(size * 1000) / 1000])
        if (size === 0) {
          this.currentBids.delete(price)
        } else {
          this.currentBids.set(price, size)
        }
      } else {
        delta.asks.push([price, Math.round(size * 1000) / 1000])
        if (size === 0) {
          this.currentAsks.delete(price)
        } else {
          this.currentAsks.set(price, size)
        }
      }
    }

    return delta
  }

  // Generate full snapshot
  private generateSnapshot(): OrderbookUpdate {
    this.sequence += 1
    const currentPrice = this.getCurrentPrice()
    const bids = this.generatePriceLevels(20, currentPrice, true)
    const asks = this.generatePriceLevels(20, currentPrice, false)

    // Update current state
    this.currentBids = new Map(bids)
    this.currentAsks = new Map(asks)

    return {
      sequence: this.sequence,
      bids,
      asks,
    }
  }

  // Start the mock server
  start(updateInterval: number = 500): void {
    if (this.intervalId !== null) {
      return // Already started
    }

    // Send initial snapshot
    const initialSnapshot = this.generateSnapshot()
    this.subscribers.forEach((callback) => {
      callback(initialSnapshot)
    })

    // Then send delta updates
    this.intervalId = window.setInterval(() => {
      const delta = this.generateDelta()
      this.subscribers.forEach((callback) => {
        callback(delta)
      })
    }, updateInterval)
  }

  // Stop the mock server
  stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  // Subscribe to orderbook updates (unified - can be snapshot or delta)
  subscribe(callback: (update: OrderbookUpdate) => void): () => void {
    this.subscribers.add(callback)
    return () => {
      this.subscribers.delete(callback)
    }
  }

  // Check if server is running
  isRunning(): boolean {
    return this.intervalId !== null
  }

  // Reset for testing
  reset(): void {
    this.currentBids.clear()
    this.currentAsks.clear()
    this.sequence = 0
  }

  // Simulate missing a sequence (for testing gap detection)
  skipSequence(): void {
    this.sequence += 1
  }
}

// Export singleton instance
export const mockOrderbookServer = new MockOrderbookServer()

