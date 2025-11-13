import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";

export const maxDuration = 30;

export async function POST(req: Request) {
  console.log("[v0] ====== Generate Response API called ======");

  try {
    const { query, talksData }: { query: string; talksData: any } =
      await req.json();
    console.log("[v0] Received query:", query);
    console.log("[v0] Received talks data type:", talksData?.data?.type);
    console.log(
      "[v0] Received talks count:",
      talksData?.data?.talks?.length || talksData?.data?.segments?.length || 0
    );

    // Configure OpenAI provider with support for GitHub Copilot API
    const githubToken = process.env.GITHUB_TOKEN;
    const openaiKey = process.env.OPENAI_API_KEY;

    let openai;
    let modelName;

    if (githubToken) {
      // Use GitHub Models (Copilot API)
      console.log("[v0] Using GitHub Models API");
      openai = createOpenAI({
        apiKey: githubToken,
        baseURL: "https://models.inference.ai.azure.com",
      });
      modelName = "gpt-4o-mini";
    } else if (openaiKey) {
      // Use OpenAI directly
      console.log("[v0] Using OpenAI API");
      openai = createOpenAI({
        apiKey: openaiKey,
      });
      modelName = "gpt-4o-mini";
    } else {
      throw new Error(
        "No API key configured. Please set either GITHUB_TOKEN or OPENAI_API_KEY environment variable."
      );
    }

    const model = openai(modelName);
    console.log("[v0] Using model:", modelName);

    // Prepare context from talks data
    let contextText = "";

    if (talksData?.data?.type === "talks") {
      const talks = talksData.data.talks || [];
      contextText = `Available talks at Web Summit Lisbon 2025:\n\n${talks
        .map(
          (talk: any, index: number) =>
            `${index + 1}. **${talk.title}**
   - Speakers: ${
     Array.isArray(talk.speakers)
       ? talk.speakers.join(", ")
       : talk.speakers || "Unknown"
   }
   - Description: ${talk.description || "No description available"}
   - Duration: ${
     talk.duration_minutes
       ? `${talk.duration_minutes} minutes`
       : "Duration not specified"
   }
   - Stage: ${talk.stage || "Stage not specified"}
   - Tags: ${
     Array.isArray(talk.tags) ? talk.tags.join(", ") : talk.tags || "No tags"
   }
`
        )
        .join("\n")}`;
    } else if (talksData?.data?.type === "transcripts") {
      const segments = talksData.data.segments || [];
      contextText = `Transcript segments from Web Summit talks (with timestamps):\n\n${segments
        .map(
          (seg: any, index: number) => {
            const startMins = Math.floor(seg.startTime / 60);
            const startSecs = Math.floor(seg.startTime % 60);
            const endMins = Math.floor(seg.endTime / 60);
            const endSecs = Math.floor(seg.endTime % 60);
            return `${index + 1}. **${seg.talkTitle}** 
   - Timestamp: ${startMins}:${String(startSecs).padStart(2, "0")}-${endMins}:${String(endSecs).padStart(2, "0")}
   - Speaker: ${seg.speaker}
   - Content: "${seg.text}"
   - Video URL: ${seg.videoUrl || "Not available"}
`;
          }
        )
        .join("\n")}`;
    }

    const systemPrompt = `You are a helpful AI assistant for Web Summit Lisbon 2025. 

You have been provided with information about talks and/or transcripts from the conference. Use this information to provide helpful, accurate, and engaging responses to user questions.

IMPORTANT: When referencing transcript segments, ALWAYS include timestamps to help users find specific moments in the talks.

**CRITICAL: Timestamps are VIDEO PLAYBACK TIMES, not times of day.** For example, "2:30" means 2 minutes and 30 seconds into the video, NOT 2:30 AM/PM.

Key guidelines:
- Be conversational and informative
- Use the provided data to give specific examples and details
- If you mention a specific talk, include relevant details like speakers and key topics
- **CRITICAL**: When referencing transcript content, ALWAYS mention the timestamp as video playback time (e.g., "At 2 minutes 30 seconds into the video..." or "At the 2:30 mark in the video...")
- Format timestamps clearly as MM:SS for easy reference (this is video playback time)
- Tell users that a video player will appear below showing the exact moment you're referencing
- Be enthusiastic about the Web Summit content
- If the user asks for something not covered in the provided data, acknowledge the limitation but still be helpful

Available data:
${contextText}

Respond naturally to the user's question based on this information. Remember to highlight video timestamps when discussing specific moments! The user will see a video player below your response that starts at the timestamp you mention.`;

    const result = await generateText({
      model,
      system: systemPrompt,
      prompt: query,
      maxRetries: 2,
    });

    console.log("[v0] Generated response length:", result.text.length);

    // Only return video player if we actually found relevant transcript segments
    let videoPlayer = null;
    if (
      talksData?.data?.type === "transcripts" && 
      talksData.data.segments?.length > 0 &&
      talksData.data.segments[0]?.videoUrl
    ) {
      // Only show the first/most relevant segment to avoid multiple video players
      const firstSegment = talksData.data.segments[0];
      videoPlayer = {
        talkId: firstSegment.talkId,
        title: firstSegment.talkTitle,
        videoUrl: firstSegment.videoUrl,
        startTime: firstSegment.startTime,
      };
      console.log("[v0] Including video player data for timestamp:", firstSegment.startTime);
    } else {
      console.log("[v0] No video player - segments found:", talksData?.data?.segments?.length || 0);
    }

    return Response.json({
      success: true,
      response: result.text,
      videoPlayer: videoPlayer,
      usage: result.usage,
    });
  } catch (error: any) {
    console.error("[v0] ====== Error in generate response API ======");
    console.error("[v0] Error message:", error.message);
    console.error("[v0] Error stack:", error.stack);
    return Response.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
