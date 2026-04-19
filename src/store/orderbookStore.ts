import { create } from 'zustand'

// Price level: [price, size]
export type PriceLevel = [number, number]

export interface OrderbookSnapshot {
  sequence: number
  bids: PriceLevel[]
  asks: PriceLevel[]
}

export interface OrderbookDelta {
  sequence: number
  bids: PriceLevel[]
  asks: PriceLevel[]
}

// Unified update type that can be either snapshot or delta
export type OrderbookUpdate = OrderbookSnapshot | OrderbookDelta

export interface Order {
  price: number
  amount: number
  total: number
}

export interface OrderbookState {
  bids: Map<number, number> // price -> size
  asks: Map<number, number> // price -> size
  spread: number
  spreadPercentage: number
  lastPrice: number
  lastSequence: number | null
  isConnected: boolean
  applyUpdate: (update: OrderbookUpdate) => void
  getSortedBids: () => Order[]
  getSortedAsks: () => Order[]
  setConnectionStatus: (status: boolean) => void
}

export const useOrderbookStore = create<OrderbookState>((set, get) => ({
  bids: new Map(),
  asks: new Map(),
  spread: 0,
  spreadPercentage: 0,
  lastPrice: 0,
  lastSequence: null,
  isConnected: false,

  applyUpdate: (update) => {
    const { lastSequence } = get()
    const { sequence } = update

    // Check if we have a sequence gap (missed updates) or this is the first update
    const hasSequenceGap = lastSequence !== null && sequence !== lastSequence + 1
    const isFirstUpdate = lastSequence === null

    // If we missed a sequence or it's the first update, treat as snapshot
    // Otherwise, apply as delta
    const shouldApplyAsSnapshot = isFirstUpdate || hasSequenceGap

    if (shouldApplyAsSnapshot) {
      // Apply as full snapshot
      const bids = new Map(update.bids)
      const asks = new Map(update.asks)

      // Calculate spread and last price
      const sortedBids = Array.from(bids.entries()).sort((a, b) => b[0] - a[0])
      const sortedAsks = Array.from(asks.entries()).sort((a, b) => a[0] - b[0])
      const bestBid = sortedBids[0]?.[0] || 0
      const bestAsk = sortedAsks[0]?.[0] || 0
      const spread = bestAsk - bestBid
      const spreadPercentage = bestBid > 0 ? (spread / bestBid) * 100 : 0
      const lastPrice = bestBid || bestAsk || 0

      set({
        bids,
        asks,
        spread,
        spreadPercentage,
        lastPrice,
        lastSequence: sequence,
      })
    } else {
      // Apply as delta
      const { bids, asks } = get()

      // Apply bid updates
      update.bids.forEach(([price, size]) => {
        if (size === 0) {
          bids.delete(price)
        } else {
          bids.set(price, size)
        }
      })

      // Apply ask updates
      update.asks.forEach(([price, size]) => {
        if (size === 0) {
          asks.delete(price)
        } else {
          asks.set(price, size)
        }
      })

      // Create new Map instances to trigger reactivity
      const newBids = new Map(bids)
      const newAsks = new Map(asks)

      // Calculate spread and last price
      const sortedBids = Array.from(newBids.entries()).sort((a, b) => b[0] - a[0])
      const sortedAsks = Array.from(newAsks.entries()).sort((a, b) => a[0] - b[0])
      const bestBid = sortedBids[0]?.[0] || 0
      const bestAsk = sortedAsks[0]?.[0] || 0
      const spread = bestAsk - bestBid
      const spreadPercentage = bestBid > 0 ? (spread / bestBid) * 100 : 0
      const lastPrice = bestBid || bestAsk || 0

      set({
        bids: newBids,
        asks: newAsks,
        spread,
        spreadPercentage,
        lastPrice,
        lastSequence: sequence,
      })
    }
  },

  getSortedBids: () => {
    const { bids } = get()
    const sorted = Array.from(bids.entries())
      .sort((a, b) => b[0] - a[0]) // Descending by price
      .map(([price, amount]) => ({ price, amount }))

    // Calculate cumulative totals
    let runningTotal = 0
    return sorted.map((order) => {
      runningTotal += order.amount
      return { ...order, total: runningTotal }
    })
  },

  getSortedAsks: () => {
    const { asks } = get()
    const sorted = Array.from(asks.entries())
      .sort((a, b) => a[0] - b[0]) // Ascending by price
      .map(([price, amount]) => ({ price, amount }))

    // Calculate cumulative totals
    let runningTotal = 0
    return sorted.map((order) => {
      runningTotal += order.amount
      return { ...order, total: runningTotal }
    })
  },

  setConnectionStatus: (status) => set({ isConnected: status }),
}))

