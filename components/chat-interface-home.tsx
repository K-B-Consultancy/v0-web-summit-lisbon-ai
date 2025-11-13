"use client"

import type React from "react"

import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send, Sparkles } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import Markdown from "react-markdown"
import { VideoPlayer } from "@/components/video-player"

interface VideoPlayerState {
  talkId: string
  title: string
  videoUrl: string
  startTime?: number
}

export function ChatInterface() {
  const [input, setInput] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [videoPlayer, setVideoPlayer] = useState<VideoPlayerState | null>(null)

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
    onError: (error) => {
      console.error("[v0] Chat error:", error)
    },
  })

  useEffect(() => {
    console.log("[v0] Chat status:", status)
  }, [status])

  useEffect(() => {
    if (error) {
      console.error("[v0] Chat error state:", error)
    }
  }, [error])

  useEffect(() => {
    console.log("[v0] Messages updated, count:", messages.length)
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1]
      console.log("[v0] Last message role:", lastMessage.role)
      console.log("[v0] Last message parts:", lastMessage.parts.length)
      lastMessage.parts.forEach((part, index) => {
        console.log(`[v0] Part ${index} type:`, part.type)
        if (part.type === "text") {
          console.log(`[v0] Part ${index} text:`, (part as any).text?.substring(0, 100))
        }
      })
    }
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || status === "in_progress") return
    console.log("[v0] Sending message:", input)
    sendMessage({ text: input })
    setInput("")
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
      {/* Empty State */}
      {messages.length === 0 && (
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center max-w-2xl">
            <div className="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#ff3366]/10 border border-[#ff3366]/20">
              <Sparkles className="h-8 w-8 text-[#ff3366]" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 text-balance">
              Ask me anything about Web Summit talks
            </h1>
            <p className="text-zinc-400 text-lg mb-8">
              I can help you discover talks, learn about speakers, and get insights from Web Summit Lisbon 2025
            </p>
            <div className="grid gap-3 sm:grid-cols-2 text-left">
              {[
                "What talks are available?",
                "Tell me about AI sessions",
                "Show me the keynote talk",
                "Find talks about sustainability",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setInput(suggestion)}
                  className="px-4 py-3 text-sm text-zinc-300 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-[#ff3366]/50 rounded-lg transition-colors text-left"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      {messages.length > 0 && (
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
          {messages.map((message) => (
            <div key={message.id}>
              <div className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-4 py-3 ${
                    message.role === "user"
                      ? "bg-[#ff3366] text-white"
                      : "bg-zinc-900 text-zinc-100 border border-zinc-800"
                  }`}
                >
                  {message.parts
                    .filter((part) => part.type === "text")
                    .map((part, index) =>
                      message.role === "user" ? (
                        <p key={index} className="text-sm leading-relaxed whitespace-pre-wrap">
                          {part.text}
                        </p>
                      ) : (
                        <div key={index} className="prose prose-invert prose-sm max-w-none">
                          <Markdown>{part.text}</Markdown>
                        </div>
                      ),
                    )}
                  {message.role === "assistant" &&
                    message.parts.filter((part) => part.type === "text").length === 0 && (
                      <p className="text-xs text-zinc-500 italic">Processing response...</p>
                    )}
                </div>
              </div>
              {message.role === "assistant" && (message as any).metadata?.videoPlayer && (
                <div className="mt-4">
                  <VideoPlayer
                    talkId={(message as any).metadata.videoPlayer.talkId}
                    title={(message as any).metadata.videoPlayer.title}
                    videoUrl={(message as any).metadata.videoPlayer.videoUrl}
                    startTime={(message as any).metadata.videoPlayer.startTime}
                  />
                </div>
              )}
            </div>
          ))}
          {status === "in_progress" && (
            <div className="flex gap-3 justify-start">
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4">
                <div className="flex gap-1.5">
                  <div
                    className="w-2 h-2 bg-[#ff3366] rounded-full animate-bounce"
                    style={{ animationDelay: "0ms", animationDuration: "1s" }}
                  />
                  <div
                    className="w-2 h-2 bg-[#ff3366] rounded-full animate-bounce"
                    style={{ animationDelay: "150ms", animationDuration: "1s" }}
                  />
                  <div
                    className="w-2 h-2 bg-[#ff3366] rounded-full animate-bounce"
                    style={{ animationDelay: "300ms", animationDuration: "1s" }}
                  />
                </div>
              </div>
            </div>
          )}
          {error && (
            <div className="flex gap-3 justify-start">
              <div className="bg-red-950/50 border border-red-900/50 rounded-2xl px-4 py-3 text-red-200 text-sm">
                <p className="font-medium">Error: Unable to get response</p>
                <p className="text-xs text-red-300 mt-1">{error.message}</p>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Input Form */}
      <div className="border-t border-zinc-800 bg-zinc-950/50 backdrop-blur-sm p-4">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="relative flex items-end gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about Web Summit talks..."
              disabled={status === "in_progress"}
              className="min-h-[60px] max-h-[200px] resize-none bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-[#ff3366] pr-12"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || status === "in_progress"}
              className="absolute bottom-2 right-2 bg-[#ff3366] hover:bg-[#e62958] text-white h-10 w-10"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
