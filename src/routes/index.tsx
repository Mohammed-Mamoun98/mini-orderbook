import { createFileRoute } from '@tanstack/react-router'
import { Orderbook } from '../components/Orderbook'

export const Route = createFileRoute('/')({
  component: App,
})

function App() {
  return (
    <div className="py-8">
      <Orderbook />
    </div>
  )
}
