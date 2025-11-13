import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const { talkId, videoUrl, speakers } = await request.json()

    if (!talkId || !videoUrl) {
      return NextResponse.json({ error: "Talk ID and video URL are required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Update status to processing
    await supabase.from("talks").update({ transcript_status: "processing" }).eq("id", talkId)

    console.log("[v0] Starting transcription for talk:", talkId)

    const assemblyaiApiKey = process.env.ASSEMBLYAI_API_KEY

    if (!assemblyaiApiKey) {
      await supabase
        .from("talks")
        .update({
          transcript_status: "failed",
          transcript_error: "ASSEMBLYAI_API_KEY not configured",
        })
        .eq("id", talkId)

      return NextResponse.json({ error: "Transcription service not configured" }, { status: 500 })
    }

    try {
      console.log("[v0] Submitting video to AssemblyAI for transcription:", videoUrl)

      // Step 1: Submit transcription request with speaker diarization enabled
      const uploadResponse = await fetch("https://api.assemblyai.com/v2/transcript", {
        method: "POST",
        headers: {
          authorization: assemblyaiApiKey,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          audio_url: videoUrl,
          speaker_labels: true, // Enable speaker diarization
        }),
      })

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text()
        throw new Error(`AssemblyAI upload failed: ${errorText}`)
      }

      const uploadData = await uploadResponse.json()
      const transcriptId = uploadData.id

      console.log("[v0] Transcription submitted. ID:", transcriptId)

      // Step 2: Poll for completion (this can take several minutes for 30min videos)
      let transcript: any = null
      let attempts = 0
      const maxAttempts = 120 // 10 minutes max polling (5 second intervals)

      while (attempts < maxAttempts) {
        const pollResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
          headers: {
            authorization: assemblyaiApiKey,
          },
        })

        if (!pollResponse.ok) {
          throw new Error("Failed to poll transcription status")
        }

        transcript = await pollResponse.json()

        console.log("[v0] Transcription status:", transcript.status)

        if (transcript.status === "completed") {
          break
        } else if (transcript.status === "error") {
          throw new Error(`AssemblyAI transcription failed: ${transcript.error}`)
        }

        // Wait 5 seconds before polling again
        await new Promise((resolve) => setTimeout(resolve, 5000))
        attempts++
      }

      if (!transcript || transcript.status !== "completed") {
        throw new Error("Transcription timed out")
      }

      console.log("[v0] Transcription completed successfully!")

      // Step 3: Process utterances and insert into database
      const speakersList = Array.isArray(speakers) ? speakers : [speakers || "Speaker"]
      const segments = []

      // Extract utterances with speaker labels
      if (transcript.utterances && transcript.utterances.length > 0) {
        for (const utterance of transcript.utterances) {
          // Map speaker labels (A, B, C...) to provided speaker names
          const speakerIndex = utterance.speaker.charCodeAt(0) - 65 // A=0, B=1, C=2...
          const speakerName = speakersList[speakerIndex % speakersList.length] || `Speaker ${speakerIndex + 1}`

          segments.push({
            talk_id: talkId,
            start_seconds: Math.floor(utterance.start / 1000), // Convert ms to seconds
            end_seconds: Math.floor(utterance.end / 1000),
            text: utterance.text,
            speaker_name: speakerName,
            speaker_label: utterance.speaker,
          })
        }
      }

      console.log("[v0] Inserting", segments.length, "segments into database")

      // Insert segments into database
      const { error: insertError } = await supabase.from("transcript_segments").insert(segments)

      if (insertError) {
        console.error("[v0] Error inserting segments:", insertError)
        throw insertError
      }

      // Step 4: Calculate duration and update talk
      const durationSeconds = transcript.audio_duration || 0
      const durationMinutes = Math.ceil(durationSeconds / 60)

      await supabase
        .from("talks")
        .update({
          transcript_status: "completed",
          duration_minutes: durationMinutes,
        })
        .eq("id", talkId)

      console.log("[v0] Transcription complete! Total duration:", durationMinutes, "minutes")

      return NextResponse.json({
        success: true,
        segmentCount: segments.length,
        duration: durationMinutes,
      })
    } catch (error) {
      console.error("[v0] Transcription error:", error)

      await supabase
        .from("talks")
        .update({
          transcript_status: "failed",
          transcript_error: error instanceof Error ? error.message : "Transcription failed",
        })
        .eq("id", talkId)

      throw error
    }
  } catch (error) {
    console.error("[v0] Error in generate-transcript route:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to generate transcript",
      },
      { status: 500 },
    )
  }
}
