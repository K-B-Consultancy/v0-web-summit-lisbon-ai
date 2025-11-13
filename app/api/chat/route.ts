import { convertToModelMessages, streamText, type UIMessage, tool } from "ai"
import { createOpenAI } from "@ai-sdk/openai"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

export const maxDuration = 30

// Helper function to format seconds as mm:ss
function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, "0")}`
}

export async function POST(req: Request) {
  console.log("[v0] ====== Chat API called ======")

  try {
    const { messages }: { messages: UIMessage[] } = await req.json()
    console.log("[v0] Received messages count:", messages.length)
    console.log("[v0] Last user message:", JSON.stringify(messages[messages.length - 1]))

    const supabase = await createClient()

    const modelMessages = convertToModelMessages(messages)
    console.log("[v0] Converted model messages count:", modelMessages.length)

    // Configure OpenAI provider with support for GitHub Copilot API
    const githubToken = process.env.GITHUB_TOKEN
    const openaiKey = process.env.OPENAI_API_KEY
    
    let openai
    let modelName
    
    if (githubToken) {
      // Use GitHub Models (Copilot API)
      console.log("[v0] Using GitHub Models API")
      openai = createOpenAI({
        apiKey: githubToken,
        baseURL: "https://models.inference.ai.azure.com",
      })
      modelName = "gpt-4o-mini"
    } else if (openaiKey) {
      // Use OpenAI directly
      console.log("[v0] Using OpenAI API")
      openai = createOpenAI({
        apiKey: openaiKey,
      })
      modelName = "gpt-4o-mini"
    } else {
      throw new Error("No API key configured. Please set either GITHUB_TOKEN or OPENAI_API_KEY environment variable.")
    }

    const model = openai(modelName)
    console.log("[v0] Using model:", modelName)

    const result = streamText({
      model,
      messages: modelMessages,
      system: `You are a helpful AI assistant for Web Summit Lisbon 2025.

When users ask questions:
1. Use the available tools to find information
2. ALWAYS respond with text explaining what you found
3. Be conversational and informative

Example:
User: "What talks are available?"
You: Call getTalks tool → Then respond: "I found 10 talks at Web Summit! Here are some highlights:..."

Never end without providing a text response to the user.`,
      abortSignal: req.signal,
      tools: {
        searchTranscripts: tool({
          description:
            "Search through talk transcripts to find relevant information. Use this to answer user questions about talk content, speakers, topics, etc. Returns transcript segments with timestamps.",
          inputSchema: z.object({
            query: z.string().describe("The search query to find relevant transcript segments"),
            talkId: z
              .string()
              .optional()
              .describe("Optional: Limit search to a specific talk ID if the user is asking about a specific talk"),
          }),
          execute: async ({ query, talkId }) => {
            console.log("[v0] searchTranscripts called with query:", query, "talkId:", talkId)
            try {
              let segmentQuery = supabase
                .from("transcript_segments")
                .select(
                  `
                id,
                talk_id,
                start_seconds,
                end_seconds,
                speaker_label,
                speaker_name,
                text,
                talks!inner(
                  id,
                  title,
                  speakers,
                  description,
                  video_url,
                  status
                )
              `,
                )
                .eq("talks.status", "published")

              if (talkId) {
                segmentQuery = segmentQuery.eq("talk_id", talkId)
              }

              segmentQuery = segmentQuery.textSearch("text", query.split(" ").join(" | "))

              const { data: segments, error } = await segmentQuery.limit(10).order("start_seconds", { ascending: true })

              if (error) {
                console.error("[v0] Error searching transcripts:", error)
                return { success: false, error: error.message }
              }

              console.log("[v0] Found segments:", segments?.length || 0)

              const formattedSegments = (segments || []).map((seg: any) => ({
                talkId: seg.talk_id,
                talkTitle: seg.talks.title,
                speakers: seg.talks.speakers,
                speaker: seg.speaker_name || seg.speaker_label,
                startTime: seg.start_seconds,
                endTime: seg.end_seconds,
                timeRange: `${formatTimestamp(seg.start_seconds)}–${formatTimestamp(seg.end_seconds)}`,
                text: seg.text,
                citation: `[${seg.talks.title} ${formatTimestamp(seg.start_seconds)}–${formatTimestamp(seg.end_seconds)}]`,
                videoUrl: seg.talks.video_url,
              }))

              return {
                success: true,
                segments: formattedSegments,
                message:
                  formattedSegments.length > 0
                    ? `Found ${formattedSegments.length} relevant transcript segments`
                    : "No matching transcript segments found for this query",
              }
            } catch (error: any) {
              console.error("[v0] Error in searchTranscripts:", error)
              return { success: false, error: error.message }
            }
          },
        }),
        getTalks: tool({
          description:
            "Get a list of published talks from the Web Summit conference. Use this when users ask about available talks, speakers, or want a general overview. For specific content questions, use searchTranscripts instead.",
          inputSchema: z.object({
            searchQuery: z
              .string()
              .optional()
              .describe("Optional search term to filter talks by title, speaker, or description"),
          }),
          execute: async ({ searchQuery }) => {
            console.log("[v0] getTalks called with searchQuery:", searchQuery)
            let query = supabase
              .from("talks")
              .select("id, title, speakers, description, duration_minutes, video_url, tags, stage")
              .eq("status", "published")
              .order("created_at", { ascending: false })

            if (searchQuery) {
              query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
            }

            const { data: talks, error } = await query.limit(10)

            if (error) {
              console.error("[v0] Error fetching talks:", error)
              return { success: false, error: error.message }
            }

            console.log("[v0] Found talks:", talks?.length || 0)
            return { success: true, talks: talks || [] }
          },
        }),
        showVideo: tool({
          description:
            "Display a video player for a specific talk at a specific timestamp. Use this when users ask to watch a talk, show a video, or you want to reference a specific moment. The video player will appear inline in the chat.",
          inputSchema: z.object({
            talkId: z.string().describe("The ID of the talk to display"),
            startTime: z.number().optional().describe("Start time in seconds (e.g., 120 for 2:00)"),
          }),
          execute: async ({ talkId, startTime }) => {
            console.log("[v0] showVideo called with talkId:", talkId, "startTime:", startTime)
            const { data: talk, error } = await supabase
              .from("talks")
              .select("id, title, video_url")
              .eq("id", talkId)
              .eq("status", "published")
              .single()

            if (error || !talk) {
              console.error("[v0] Error fetching talk for video:", error)
              return { success: false, error: "Talk not found" }
            }

            return {
              success: true,
              videoPlayer: {
                talkId: talk.id,
                title: talk.title,
                videoUrl: talk.video_url,
                startTime,
              },
            }
          },
        }),
      },
      onStepFinish: async (step) => {
        console.log("[v0] ====== Step Finished ======")
        console.log("[v0] Tool calls:", step.toolCalls?.length || 0)
        console.log("[v0] Text present:", !!step.text)
        console.log("[v0] Text length:", step.text?.length || 0)
        if (step.text) {
          console.log("[v0] Generated text:", step.text.substring(0, 200))
        }
        if (step.toolResults) {
          console.log("[v0] Tool results count:", step.toolResults.length)
        }
      },
    })

    console.log("[v0] Stream created, returning to client")

    return result.toUIMessageStreamResponse({
      onFinish: async ( text ) => {
        console.log("[v0] ====== Response Finished ======")
        console.log("[v0] Full response object:", text)
      },
    })
  } catch (error: any) {
    console.error("[v0] ====== Error in chat API ======")
    console.error("[v0] Error message:", error.message)
    console.error("[v0] Error stack:", error.stack)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
