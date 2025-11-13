"use client";

import type React from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Markdown from "react-markdown";
import { VideoPlayer } from "@/components/video-player";

interface VideoPlayerState {
  talkId: string;
  title: string;
  videoUrl: string;
  startTime?: number;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  videoPlayer?: VideoPlayerState;
}

export function ChatInterface() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<"database" | "ai" | null>(
    null
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateMessageId = () => {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  };

  // Step 1: Fetch data from database
  const fetchTalksData = async (query: string) => {
    console.log("[v0] Step 1: Fetching talks data for query:", query);

    try {
      const response = await fetch("/api/fetch-talks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: query,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("[v0] Database fetch result:", data);
      return data;
    } catch (error) {
      console.error("[v0] Error fetching talks data:", error);
      throw error;
    }
  };

  // Step 2: Generate AI response with the fetched data
  const generateAIResponse = async (query: string, talksData: any) => {
    console.log("[v0] Step 2: Generating AI response with data");

    try {
      const response = await fetch("/api/generate-response", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: query,
          talksData: talksData,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("[v0] AI response result:", data);

      if (data.success) {
        return data.response;
      } else {
        throw new Error(data.error || "Failed to generate response");
      }
    } catch (error) {
      console.error("[v0] Error generating AI response:", error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userQuery = input.trim();
    const userMessageId = generateMessageId();
    const assistantMessageId = generateMessageId();

    // Add user message immediately
    const userMessage: Message = {
      id: userMessageId,
      role: "user",
      content: userQuery,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Step 1: Fetch data from database
      setLoadingStep("database");
      console.log("[v0] Starting database fetch...");

      const talksData = await fetchTalksData(userQuery);
      console.log("[v0] Database fetch completed");

      // Step 2: Generate AI response
      setLoadingStep("ai");
      console.log("[v0] Starting AI response generation...");

      const aiResponse = await generateAIResponse(userQuery, talksData);
      console.log("[v0] AI response completed");

      // Add assistant message
      const assistantMessage: Message = {
        id: assistantMessageId,
        role: "assistant",
        content: aiResponse,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("[v0] Error in chat flow:", error);

      const errorMessage: Message = {
        id: assistantMessageId,
        role: "assistant",
        content: `Sorry, I encountered an error while processing your request: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setLoadingStep(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

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
            <p className="text-zinc-400 text-lg mb-4">
              I can help you discover talks, learn about speakers, and get
              insights from Web Summit Lisbon 2025
            </p>
            <div className="mb-8 px-4 py-3 bg-amber-950/20 border border-amber-700/30 rounded-lg">
              <p className="text-amber-200/90 text-sm">
                <span className="font-semibold">Note:</span> This AI is currently trained only with talks from the first night of Web Summit that have videos uploaded to the Web Summit app.
              </p>
            </div>
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
              <div
                className={`flex gap-3 ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-4 py-3 ${
                    message.role === "user"
                      ? "bg-[#ff3366] text-white"
                      : "bg-zinc-900 text-zinc-100 border border-zinc-800"
                  }`}
                >
                  {message.role === "user" ? (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {message.content}
                    </p>
                  ) : (
                    <div className="prose prose-invert prose-sm max-w-none">
                      <Markdown>{message.content}</Markdown>
                    </div>
                  )}
                </div>
              </div>
              {message.role === "assistant" && message.videoPlayer && (
                <div className="mt-4">
                  <VideoPlayer
                    talkId={message.videoPlayer.talkId}
                    title={message.videoPlayer.title}
                    videoUrl={message.videoPlayer.videoUrl}
                    startTime={message.videoPlayer.startTime}
                  />
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <div
                      className="w-2 h-2 bg-[#ff3366] rounded-full animate-bounce"
                      style={{ animationDelay: "0ms", animationDuration: "1s" }}
                    />
                    <div
                      className="w-2 h-2 bg-[#ff3366] rounded-full animate-bounce"
                      style={{
                        animationDelay: "150ms",
                        animationDuration: "1s",
                      }}
                    />
                    <div
                      className="w-2 h-2 bg-[#ff3366] rounded-full animate-bounce"
                      style={{
                        animationDelay: "300ms",
                        animationDuration: "1s",
                      }}
                    />
                  </div>
                  <span className="text-xs text-zinc-400">
                    {loadingStep === "database"
                      ? "Fetching talks data..."
                      : loadingStep === "ai"
                      ? "Generating response..."
                      : "Processing..."}
                  </span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Input Form */}
      <div className="border-t border-zinc-800 bg-zinc-950/50 backdrop-blur-sm p-4">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          {messages.length > 0 && (
            <div className="mb-3 px-3 py-2 bg-amber-950/20 border border-amber-700/30 rounded-md">
              <p className="text-amber-200/90 text-xs">
                <span className="font-semibold">Note:</span> This AI is currently trained only with talks from the first night of Web Summit that have videos uploaded to the Web Summit app.
              </p>
            </div>
          )}
          <div className="relative flex items-end gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about Web Summit talks..."
              disabled={isLoading}
              className="min-h-[60px] max-h-[200px] resize-none bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-[#ff3366] pr-12"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || isLoading}
              className="absolute bottom-2 right-2 bg-[#ff3366] hover:bg-[#e62958] text-white h-10 w-10"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
