import { useEffect } from 'react'
import { mockOrderbookServer } from '../services/mockOrderbookServer'
import { useOrderbookStore } from '../store/orderbookStore'
import { OrderRow } from './OrderRow'
import { Spread } from './Spread'

export function Orderbook() {
  const {
    spread,
    spreadPercentage,
    lastPrice,
    isConnected,
    applyUpdate,
    getSortedBids,
    getSortedAsks,
    setConnectionStatus,
  } = useOrderbookStore()

  useEffect(() => {
    // Start mock server
    mockOrderbookServer.start(500)
    setConnectionStatus(true)

    // Subscribe to updates (unified - store decides snapshot vs delta based on sequence)
    const unsubscribe = mockOrderbookServer.subscribe((update) => {
      console.log('update', update)
      applyUpdate(update)
    })

    // Cleanup on unmount
    return () => {
      unsubscribe()
      mockOrderbookServer.stop()
      setConnectionStatus(false)
    }
  }, [applyUpdate, setConnectionStatus])

  const sortedBids = getSortedBids()
  const sortedAsks = getSortedAsks()

  const maxTotal = Math.max(
    ...sortedBids.map((b) => b.total),
    ...sortedAsks.map((a) => a.total),
    1, // Prevent division by zero
  )

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <div className="bg-gray-900 rounded-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gray-800 px-6 py-4 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">Orderbook DEX</h1>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm text-gray-300">{isConnected ? 'Connected' : 'Disconnected'}</span>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-400">Last Price</div>
                <div className="text-lg font-semibold text-white">${lastPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Orderbook Content */}
        <div className="flex flex-col">
          {/* Asks (Sell Orders) - Top */}
          <div className="bg-gray-900">
            <div className="px-4 py-2 bg-red-900/20 border-b border-gray-700">
              <div className="grid grid-cols-3 gap-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <div>Price</div>
                <div className="text-right">Amount</div>
                <div className="text-right">Total</div>
              </div>
            </div>
            <div className="max-h-[400px] overflow-y-auto">
              {sortedAsks.map((ask, index: number) => (
                <OrderRow
                  key={`ask-${ask.price}-${index}`}
                  order={ask}
                  maxTotal={maxTotal}
                  type="ask"
                />
              ))}
            </div>
          </div>

          {/* Spread - Middle */}
          <div className="border-t border-b border-gray-700 bg-gray-800">
            <Spread spread={spread} spreadPercentage={spreadPercentage} bestBid={sortedBids[0]?.price} bestAsk={sortedAsks[0]?.price} />
          </div>

          {/* Bids (Buy Orders) - Bottom */}
          <div className="bg-gray-900">
            <div className="px-4 py-2 bg-green-900/20 border-b border-gray-700">
              <div className="grid grid-cols-3 gap-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <div>Price</div>
                <div className="text-right">Amount</div>
                <div className="text-right">Total</div>
              </div>
            </div>
            <div className="max-h-[400px] overflow-y-auto">
              {sortedBids.map((bid, index: number) => (
                <OrderRow
                  key={`bid-${bid.price}-${index}`}
                  order={bid}
                  maxTotal={maxTotal}
                  type="bid"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

