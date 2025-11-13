import { ChatInterface } from "@/components/chat-interface-home"

export default async function HomePage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-950/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto flex items-center justify-between px-4 py-3 md:py-4">
          <div>
            <div className="text-xl md:text-2xl font-bold text-[#ff3366]">WEB SUMMIT</div>
            <div className="text-xs text-zinc-400">LISBON 2025</div>
          </div>
        </div>
      </header>

      {/* Main Chat Interface */}
      <ChatInterface />
    </div>
  )
}
