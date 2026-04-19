import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/ws")({
	component: RouteComponent,
});

const map = new Map<number, number>();
// amt, price
map.set(1, 100);
map.set(2, 200);
map.set(3, 300);

let avgPrice = 0;
let total = 0;
let weightedAvgPrice = 0;
map.forEach((price, amt) => {
    weightedAvgPrice += price * amt;
	console.log({ price, amt });
	avgPrice += price;
	total += amt;
});
avgPrice /= total;
weightedAvgPrice /= total;
console.log({ avgPrice, total });
console.log({ weightedAvgPrice });

type ServerEvent = {
	type: "snapshot" | "delta" | "pong";
	sequence: number;
	bids: [number, number][];
	asks: [number, number][];
	timestamp: number;
};

const WS_URL = "ws://localhost:8080";
const RECONNECT_DELAY = 1000; // Start with 1 second
const MAX_RECONNECT_DELAY = 30000; // Max 30 seconds
const RECONNECT_MULTIPLIER = 1.5; // Exponential backoff multiplier

function RouteComponent() {
	const [connectionStatus, setConnectionStatus] = useState<
		"connected" | "disconnected" | "connecting" | "error"
	>("disconnected");
	const wsRef = useRef<WebSocket | null>(null);
	const reconnectTimeoutRef = useRef<number | null>(null);
	const reconnectDelayRef = useRef<number>(RECONNECT_DELAY);
	const shouldReconnectRef = useRef<boolean>(true);
	const connectRef = useRef<(() => void) | null>(null);
	const [messageLog, setMessageLog] = useState<string[]>([]);

	const addMessage = useCallback((message: string) => {
		setMessageLog((prev) => {
			const newLog = [
				...prev,
				`[${new Date().toLocaleTimeString()}] ${message}`,
			];
			return newLog.slice(-50); // Keep last 50 messages
		});
	}, []);

	const connect = useCallback(() => {
		if (wsRef.current?.readyState === WebSocket.OPEN) {
			return; // Already connected
		}

		if (wsRef.current?.readyState === WebSocket.CONNECTING) {
			return; // Already connecting
		}

		try {
			setConnectionStatus("connecting");
			console.log(`Connecting to ${WS_URL}...`);

			const ws = new WebSocket(WS_URL);
			wsRef.current = ws;

			ws.onopen = () => {
				console.log("✅ Connected to WebSocket server");
				setConnectionStatus("connected");
				reconnectDelayRef.current = RECONNECT_DELAY; // Reset delay on successful connection

				// Subscribe to orderbook updates
				ws.send(JSON.stringify({ type: "subscribe" }));
				addMessage("✅ Connected and subscribed");
			};

			ws.onmessage = (event: MessageEvent<string>) => {
				try {
					const data: ServerEvent | null = JSON.parse(event.data);
					if (!data) {
						addMessage("❌ Invalid message format");
						return;
					}

					console.log("📨 Message from WS:", data);

					if (data.type === "snapshot") {
						addMessage(
							`📸 Snapshot #${data.sequence} (${data.bids.length} bids, ${data.asks.length} asks)`,
						);
					} else if (data.type === "delta") {
						addMessage(
							`🔄 Delta #${data.sequence} (${data.bids.length} bid updates, ${data.asks.length} ask updates)`,
						);
					} else if (data.type === "pong") {
						addMessage("🏓 Pong received");
					}
				} catch (error) {
					console.error("Error parsing message:", error);
					addMessage("❌ Error parsing message");
				}
			};

			ws.onclose = (event) => {
				console.log("🔌 WebSocket closed", event.code, event.reason);
				setConnectionStatus("disconnected");
				wsRef.current = null;

				// Only reconnect if we should (not manually closed)
				if (shouldReconnectRef.current) {
					// Schedule reconnect using ref to avoid circular dependency
					if (reconnectTimeoutRef.current) {
						clearTimeout(reconnectTimeoutRef.current);
					}

					const delay = reconnectDelayRef.current;
					console.log(`⏳ Scheduling reconnect in ${delay}ms...`);
					addMessage(`⏳ Reconnecting in ${(delay / 1000).toFixed(1)}s...`);

					reconnectTimeoutRef.current = window.setTimeout(() => {
						reconnectDelayRef.current = Math.min(
							reconnectDelayRef.current * RECONNECT_MULTIPLIER,
							MAX_RECONNECT_DELAY,
						);
						if (connectRef.current) {
							connectRef.current();
						}
					}, delay);
				}
			};

			ws.onerror = (error) => {
				console.error("❌ WebSocket error:", error);
				setConnectionStatus("error");
				addMessage("❌ Connection error occurred");
			};
		} catch (error) {
			console.error("Failed to create WebSocket:", error);
			setConnectionStatus("error");
			addMessage("❌ Failed to create connection");

			if (shouldReconnectRef.current) {
				// Schedule reconnect using ref to avoid circular dependency
				if (reconnectTimeoutRef.current) {
					clearTimeout(reconnectTimeoutRef.current);
				}

				const delay = reconnectDelayRef.current;
				addMessage(`⏳ Reconnecting in ${(delay / 1000).toFixed(1)}s...`);

				reconnectTimeoutRef.current = window.setTimeout(() => {
					reconnectDelayRef.current = Math.min(
						reconnectDelayRef.current * RECONNECT_MULTIPLIER,
						MAX_RECONNECT_DELAY,
					);
					if (connectRef.current) {
						connectRef.current();
					}
				}, delay);
			}
		}
	}, [addMessage]);

	// Store connect in ref for reconnection logic to use
	connectRef.current = connect;

	const disconnect = () => {
		shouldReconnectRef.current = false;

		if (reconnectTimeoutRef.current) {
			clearTimeout(reconnectTimeoutRef.current);
			reconnectTimeoutRef.current = null;
		}

		if (wsRef.current) {
			wsRef.current.close();
			wsRef.current = null;
		}

		setConnectionStatus("disconnected");
		addMessage("🔌 Manually disconnected (auto-reconnect disabled)");
	};

	useEffect(() => {
		// Connect on mount
		connect();

		// Cleanup on unmount
		return () => {
			shouldReconnectRef.current = false;

			if (reconnectTimeoutRef.current) {
				clearTimeout(reconnectTimeoutRef.current);
			}

			if (wsRef.current) {
				wsRef.current.close();
				wsRef.current = null;
			}
		};
	}, [connect]);

	const getStatusColor = () => {
		switch (connectionStatus) {
			case "connected":
				return "text-green-400";
			case "connecting":
				return "text-yellow-400";
			case "error":
				return "text-red-400";
			default:
				return "text-gray-400";
		}
	};

	return (
		<div className="flex flex-col items-center justify-center min-h-screen text-white p-8">
			<div className="max-w-2xl w-full space-y-6">
				<div className="bg-gray-800 p-6 rounded-lg">
					<h1 className="text-2xl font-bold mb-4">WebSocket Connection</h1>
					<div className="flex items-center gap-4 mb-4">
						<div className={`text-lg font-semibold ${getStatusColor()}`}>
							Status: {connectionStatus.toUpperCase()}
						</div>
						<div className="text-sm text-gray-400">{WS_URL}</div>
					</div>

					<div className="flex gap-4">
						<button
							type="button"
							onClick={connect}
							disabled={
								connectionStatus === "connected" ||
								connectionStatus === "connecting"
							}
							className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded transition-colors"
						>
							Connect
						</button>
						<button
							type="button"
							onClick={() => {
								if (wsRef.current?.readyState === WebSocket.OPEN) {
									wsRef.current.send(JSON.stringify({ type: "subscribe" }));
									addMessage("📤 Resent subscription request");
								}
							}}
							disabled={connectionStatus !== "connected"}
							className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded transition-colors"
						>
							Resubscribe
						</button>
						<button
							type="button"
							onClick={disconnect}
							disabled={connectionStatus === "disconnected"}
							className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded transition-colors"
						>
							Disconnect
						</button>
					</div>
				</div>

				<div className="bg-gray-800 p-6 rounded-lg">
					<h2 className="text-xl font-bold mb-4">Message Log</h2>
					<div className="bg-gray-900 p-4 rounded h-96 overflow-y-auto font-mono text-sm">
						{messageLog.length === 0 ? (
							<div className="text-gray-500">No messages yet...</div>
						) : (
							messageLog.map((msg, idx) => (
								<div
									key={`log-${idx}-${msg.slice(0, 20)}`}
									className="mb-1 text-gray-300"
								>
									{msg}
								</div>
							))
						)}
					</div>
					<button
						type="button"
						onClick={() => setMessageLog([])}
						className="mt-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
					>
						Clear Log
					</button>
				</div>
			</div>
		</div>
	);
}
