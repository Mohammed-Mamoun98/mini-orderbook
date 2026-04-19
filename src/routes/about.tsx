import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/about')({
  component: About,
})

function About() {
  return (
    <div className="py-8 px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-6">About Orderbook DEX</h1>
        
        <div className="space-y-6 text-gray-300">
          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">What is this?</h2>
            <p className="leading-relaxed">
              This is a decentralized exchange (DEX) orderbook visualization built with modern web technologies.
              It demonstrates real-time orderbook data management using efficient Map-based data structures and
              sequence-based update handling.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">Features</h2>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Real-time orderbook updates with mock data</li>
              <li>Efficient Map-based price level storage</li>
              <li>Sequence-based update handling with automatic gap detection</li>
              <li>Automatic snapshot fallback when sequence gaps are detected</li>
              <li>Beautiful, responsive UI with depth visualization</li>
              <li>Spread calculation and display</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">Technology Stack</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-800 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-2">Frontend</h3>
                <ul className="text-sm space-y-1 text-gray-300">
                  <li>• React 19</li>
                  <li>• TanStack Router</li>
                  <li>• Zustand (State Management)</li>
                  <li>• Tailwind CSS</li>
                  <li>• TypeScript</li>
                </ul>
              </div>
              <div className="bg-gray-800 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-2">Architecture</h3>
                <ul className="text-sm space-y-1 text-gray-300">
                  <li>• Map-based orderbook storage</li>
                  <li>• Sequence tracking</li>
                  <li>• Delta updates</li>
                  <li>• Snapshot fallback</li>
                  <li>• Mock data server</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">How it Works</h2>
            <div className="bg-gray-800 p-6 rounded-lg space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">1. Initial Snapshot</h3>
                <p className="text-sm text-gray-300">
                  When the orderbook first loads, it receives a full snapshot of all price levels.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">2. Delta Updates</h3>
                <p className="text-sm text-gray-300">
                  Subsequent updates are sent as deltas containing only the changed price levels.
                  Each update includes a sequence number for tracking.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">3. Gap Detection</h3>
                <p className="text-sm text-gray-300">
                  If a sequence gap is detected (missing updates), the system automatically
                  requests a full snapshot to resynchronize the orderbook state.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
