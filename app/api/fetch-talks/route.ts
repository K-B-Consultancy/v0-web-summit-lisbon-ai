import { createClient } from "@/lib/supabase/server";

export const maxDuration = 30;

interface FetchResult {
  success: boolean;
  data: any;
}

export async function POST(req: Request) {
  console.log("[v0] ====== Fetch Talks API called ======");

  try {
    const { query }: { query: string } = await req.json();
    console.log("[v0] Received query:", query);

    const supabase = await createClient();

    // Determine what type of data to fetch based on the query
    const queryLower = query.toLowerCase();
    let result: FetchResult = { success: true, data: null };

    if (
      queryLower.includes("transcript") ||
      queryLower.includes("content") ||
      queryLower.includes("said") ||
      queryLower.includes("mentioned") ||
      queryLower.includes("about") ||
      queryLower.includes("discuss") ||
      queryLower.includes("talk about") ||
      queryLower.includes("what") ||
      queryLower.includes("when") ||
      queryLower.includes("moment")
    ) {
      // Search transcripts
      console.log("[v0] Searching transcripts for query:", query);

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
        `
        )
        .eq("talks.status", "published");

      segmentQuery = segmentQuery.textSearch(
        "text",
        query.split(" ").join(" | ")
      );

      const { data: segments, error } = await segmentQuery
        .limit(10)
        .order("start_seconds", { ascending: true });

      if (error) {
        console.error("[v0] Error searching transcripts:", error);
        result = { success: false, data: { error: error.message } };
      } else {
        console.log("[v0] Found segments:", segments?.length || 0);

        const formattedSegments = (segments || []).map((seg: any) => ({
          talkId: seg.talk_id,
          talkTitle: seg.talks.title,
          speakers: seg.talks.speakers,
          speaker: seg.speaker_name || seg.speaker_label,
          startTime: seg.start_seconds,
          endTime: seg.end_seconds,
          text: seg.text,
          videoUrl: seg.talks.video_url,
        }));

        result = {
          success: true,
          data: {
            type: "transcripts",
            segments: formattedSegments,
            message:
              formattedSegments.length > 0
                ? `Found ${formattedSegments.length} relevant transcript segments`
                : "No matching transcript segments found for this query",
          },
        };
      }
    } else {
      // Get talks
      console.log("[v0] Fetching talks for query:", query);

      let talksQuery = supabase
        .from("talks")
        .select(
          "id, title, speakers, description, duration_minutes, video_url, tags, stage"
        )
        .eq("status", "published")
        .order("created_at", { ascending: false });

      // Check if query contains search terms
      const searchTerms = [
        "ai",
        "artificial",
        "machine",
        "learning",
        "tech",
        "startup",
        "keynote",
        "sustainability",
        "climate",
      ];
      const hasSearchTerms = searchTerms.some((term) =>
        queryLower.includes(term)
      );

      if (
        hasSearchTerms ||
        queryLower.includes("about") ||
        queryLower.includes("find")
      ) {
        // Extract search terms from query
        const extractedTerms = searchTerms.filter((term) =>
          queryLower.includes(term)
        );
        if (extractedTerms.length > 0) {
          const searchTerm = extractedTerms[0];
          talksQuery = talksQuery.or(
            `title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,speakers.cs.{"${searchTerm}"}`
          );
        }
      }

      const { data: talks, error } = await talksQuery.limit(10);

      if (error) {
        console.error("[v0] Error fetching talks:", error);
        result = { success: false, data: { error: error.message } };
      } else {
        console.log("[v0] Found talks:", talks?.length || 0);
        result = {
          success: true,
          data: {
            type: "talks",
            talks: talks || [],
            message:
              talks && talks.length > 0
                ? `Found ${talks.length} talks`
                : "No talks found matching your query",
          },
        };
      }
    }

    console.log("[v0] Fetch result:", result);
    return Response.json(result);
  } catch (error: any) {
    console.error("[v0] ====== Error in fetch talks API ======");
    console.error("[v0] Error message:", error.message);
    console.error("[v0] Error stack:", error.stack);
    return Response.json(
      { success: false, data: { error: error.message } },
      { status: 500 }
    );
  }
}
