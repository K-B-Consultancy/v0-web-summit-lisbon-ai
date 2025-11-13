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
- **IMPORTANT**: Only set videoSegmentIndex if you are DIRECTLY discussing and quoting from that specific segment in your response
- If you mention multiple segments or talks generally, set videoSegmentIndex to null
- Be enthusiastic about the Web Summit content
- If the user asks for something not covered in the provided data, acknowledge the limitation but still be helpful

Available data:
${contextText}

You MUST respond in JSON format with the following structure:
{
  "text": "Your natural language response to the user",
  "videoSegmentIndex": <number or null>,
  "referencedTalkTitle": "<exact talk title from the segment or null>"
}

**CRITICAL RULES for videoSegmentIndex and referencedTalkTitle:**
1. ONLY set videoSegmentIndex if you are directly quoting or discussing content from that specific segment
2. The segment you reference with videoSegmentIndex MUST be the one you're primarily discussing in your text
3. You MUST mention the exact talk title in your response text if setting videoSegmentIndex
4. Set referencedTalkTitle to the EXACT title of the talk from the segment you're referencing (copy it exactly)
5. If you cannot find relevant information, set both to null
6. If you're discussing multiple segments without focusing on one specific segment, set both to null

Examples:
- If discussing segment 1 about AI and mentioning it by name: {"text": "In 'The Future of AI' talk, at 2:30, they discussed...", "videoSegmentIndex": 0, "referencedTalkTitle": "The Future of AI"}
- If no relevant info found: {"text": "I don't have information about that topic.", "videoSegmentIndex": null, "referencedTalkTitle": null}
- If discussing multiple segments generally: {"text": "Several talks covered AI including...", "videoSegmentIndex": null, "referencedTalkTitle": null}

Remember: Your videoSegmentIndex choice will determine which video appears. Make absolutely sure it matches what you're discussing!`;

    const result = await generateText({
      model,
      system: systemPrompt,
      prompt: query,
      maxRetries: 2,
    });

    console.log("[v0] Generated response length:", result.text.length);

    // Parse the JSON response from the AI
    let aiResponse;
    let videoSegmentIndex = null;
    let referencedTalkTitle = null;
    try {
      aiResponse = JSON.parse(result.text);
      videoSegmentIndex = aiResponse.videoSegmentIndex;
      referencedTalkTitle = aiResponse.referencedTalkTitle;
      console.log("[v0] Parsed AI response - videoSegmentIndex:", videoSegmentIndex, "referencedTalkTitle:", referencedTalkTitle);
    } catch (error) {
      console.error("[v0] Failed to parse AI response as JSON, using raw text:", error);
      // Fallback: treat entire response as text with no video
      aiResponse = { text: result.text, videoSegmentIndex: null, referencedTalkTitle: null };
    }

    // Only return video player if AI explicitly indicated a segment
    // AND the referenced talk title matches
    let videoPlayer = null;
    if (
      talksData?.data?.type === "transcripts" && 
      talksData.data.segments?.length > 0 &&
      videoSegmentIndex !== null &&
      typeof videoSegmentIndex === 'number' &&
      videoSegmentIndex >= 0 &&
      videoSegmentIndex < talksData.data.segments.length &&
      referencedTalkTitle !== null
    ) {
      const selectedSegment = talksData.data.segments[videoSegmentIndex];
      
      // Validate that the referenced talk title matches the selected segment
      // This prevents showing videos from the wrong talk
      if (selectedSegment?.videoUrl && 
          selectedSegment?.talkTitle &&
          referencedTalkTitle &&
          selectedSegment.talkTitle.toLowerCase() === referencedTalkTitle.toLowerCase()) {
        
        // Additional validation: check if talk title is mentioned in the response text
        const responseLower = aiResponse.text.toLowerCase();
        const talkTitleLower = selectedSegment.talkTitle.toLowerCase();
        
        if (responseLower.includes(talkTitleLower)) {
          videoPlayer = {
            talkId: selectedSegment.talkId,
            title: selectedSegment.talkTitle,
            videoUrl: selectedSegment.videoUrl,
            startTime: selectedSegment.startTime,
          };
          console.log("[v0] ✅ Including video player for segment", videoSegmentIndex, "- talk:", selectedSegment.talkTitle, "timestamp:", selectedSegment.startTime);
        } else {
          console.log("[v0] ❌ Talk title not mentioned in response text, skipping video player");
        }
      } else if (!selectedSegment?.videoUrl) {
        console.log("[v0] ❌ Selected segment has no video URL");
      } else {
        console.log("[v0] ❌ Talk title mismatch - Referenced:", referencedTalkTitle, "vs Selected:", selectedSegment?.talkTitle);
      }
    } else {
      if (videoSegmentIndex === null) {
        console.log("[v0] No video player - AI indicated no specific segment (videoSegmentIndex: null)");
      } else if (referencedTalkTitle === null) {
        console.log("[v0] No video player - AI did not provide referencedTalkTitle");
      } else {
        console.log("[v0] No video player - invalid segment index or no segments available");
      }
    }

    return Response.json({
      success: true,
      response: aiResponse.text,
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
