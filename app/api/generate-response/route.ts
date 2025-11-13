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
      contextText = `Transcript segments from Web Summit talks:\n\n${segments
        .map(
          (seg: any, index: number) =>
            `${index + 1}. **${seg.talkTitle}** (${Math.floor(
              seg.startTime / 60
            )}:${String(seg.startTime % 60).padStart(2, "0")})
   - Speaker: ${seg.speaker}
   - Content: "${seg.text}"
`
        )
        .join("\n")}`;
    }

    const systemPrompt = `You are a helpful AI assistant for Web Summit Lisbon 2025. 

You have been provided with information about talks and/or transcripts from the conference. Use this information to provide helpful, accurate, and engaging responses to user questions.

Key guidelines:
- Be conversational and informative
- Use the provided data to give specific examples and details
- If you mention a specific talk, include relevant details like speakers and key topics
- If you reference transcript content, you can mention the speaker and timing
- Be enthusiastic about the Web Summit content
- If the user asks for something not covered in the provided data, acknowledge the limitation but still be helpful

Available data:
${contextText}

Respond naturally to the user's question based on this information.`;

    const result = await generateText({
      model,
      system: systemPrompt,
      prompt: query,
      maxRetries: 2,
    });

    console.log("[v0] Generated response length:", result.text.length);

    return Response.json({
      success: true,
      response: result.text,
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
