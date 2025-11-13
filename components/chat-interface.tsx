"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, Loader2 } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Message {
  id: string
  content: string
  created_at: string
  user_id: string
  profiles: {
    full_name: string | null
    email: string
  }
}

interface ChatInterfaceProps {
  talkId: string
  userId: string
  userEmail: string
  userName: string
}

export function ChatInterface({ talkId, userId, userName }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  // Fetch messages
  useEffect(() => {
    fetchMessages()

    // Subscribe to real-time messages
    const channel = supabase
      .channel(`talk-${talkId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `talk_id=eq.${talkId}`,
        },
        (payload) => {
          console.log("[v0] New message received:", payload)
          fetchMessages()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [talkId])

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const fetchMessages = async () => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from("messages")
      .select(`
        *,
        profiles (
          full_name,
          email
        )
      `)
      .eq("talk_id", talkId)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("[v0] Error fetching messages:", error)
    } else {
      setMessages(data || [])
    }
    setIsLoading(false)
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || isSending) return

    setIsSending(true)
    const { error } = await supabase.from("messages").insert({
      talk_id: talkId,
      user_id: userId,
      content: newMessage.trim(),
    })

    if (error) {
      console.error("[v0] Error sending message:", error)
      alert("Failed to send message. Please try again.")
    } else {
      setNewMessage("")
    }
    setIsSending(false)
  }

  return (
    <Card className="border-zinc-800 bg-zinc-950 h-full flex flex-col">
      <CardHeader className="border-b border-zinc-800">
        <CardTitle className="text-white flex items-center gap-2">
          Live Chat
          <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0 flex flex-col">
        {/* Messages */}
        <ScrollArea className="flex-1 px-4" ref={scrollRef}>
          <div className="py-4 space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-8 text-zinc-500 text-sm">No messages yet. Start the conversation!</div>
            ) : (
              messages.map((message) => {
                const isOwnMessage = message.user_id === userId
                const displayName = message.profiles?.full_name || message.profiles?.email?.split("@")[0] || "User"

                return (
                  <div key={message.id} className={`flex flex-col gap-1 ${isOwnMessage ? "items-end" : "items-start"}`}>
                    <div className="text-xs text-zinc-500">{isOwnMessage ? "You" : displayName}</div>
                    <div
                      className={`max-w-[80%] rounded-lg px-3 py-2 ${
                        isOwnMessage ? "bg-[#ff3366] text-white" : "bg-zinc-800 text-zinc-100"
                      }`}
                    >
                      <p className="text-sm leading-relaxed break-words">{message.content}</p>
                    </div>
                    <div className="text-xs text-zinc-600">
                      {new Date(message.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        <form onSubmit={handleSendMessage} className="p-4 border-t border-zinc-800">
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 border-zinc-700 bg-zinc-900 text-white placeholder:text-zinc-500"
              disabled={isSending}
            />
            <Button
              type="submit"
              size="icon"
              disabled={!newMessage.trim() || isSending}
              className="bg-[#ff3366] hover:bg-[#e62958] text-white"
            >
              {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
