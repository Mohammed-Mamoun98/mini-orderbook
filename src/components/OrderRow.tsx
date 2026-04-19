import type { Order } from '../store/orderbookStore'

interface OrderRowProps {
  order: Order
  maxTotal: number
  type: 'bid' | 'ask'
}

export function OrderRow({ order, maxTotal, type }: OrderRowProps) {
  const { price, amount, total = 0 } = order
  const depthPercentage = maxTotal > 0 ? (total / maxTotal) * 100 : 0

  const priceColor = type === 'bid' ? 'text-green-400' : 'text-red-400'
  const bgColor = type === 'bid' ? 'bg-green-500/10' : 'bg-red-500/10'

  return (
    <div className="relative group hover:bg-gray-800/50 transition-colors">
      {/* Depth indicator */}
      <div
        className={`absolute inset-0 ${bgColor} opacity-30`}
        style={{
          width: `${depthPercentage}%`,
          right: type === 'ask' ? 0 : 'auto',
          left: type === 'bid' ? 0 : 'auto',
        }}
      />
      
      {/* Content */}
      <div className="relative grid grid-cols-3 gap-4 px-4 py-2 text-sm">
        <div className={`font-mono font-semibold ${priceColor}`}>
          ${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className="font-mono text-gray-300 text-right">
          {amount.toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}
        </div>
        <div className="font-mono text-gray-400 text-right">
          {total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      </div>
    </div>
  )
}

