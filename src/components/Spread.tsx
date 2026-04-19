interface SpreadProps {
  spread: number
  spreadPercentage: number
  bestBid?: number
  bestAsk?: number
}

export function Spread({ spread, spreadPercentage, bestBid, bestAsk }: SpreadProps) {
  return (
    <div className="px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Spread</div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-white">
              ${spread.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-sm text-gray-400">
              ({spreadPercentage.toFixed(2)}%)
            </span>
          </div>
        </div>
        <div className="flex gap-6">
          {bestBid && (
            <div className="text-right">
              <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Best Bid</div>
              <div className="text-lg font-semibold text-green-400">
                ${bestBid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          )}
          {bestAsk && (
            <div className="text-right">
              <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Best Ask</div>
              <div className="text-lg font-semibold text-red-400">
                ${bestAsk.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

