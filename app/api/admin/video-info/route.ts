import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { videoUrl } = await request.json()

    if (!videoUrl) {
      return NextResponse.json({ error: "Video URL is required" }, { status: 400 })
    }

    // Validate URL format
    try {
      new URL(videoUrl)
    } catch {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 })
    }

    // Check if it's a video file (common video extensions)
    const videoExtensions = [".mp4", ".mov", ".avi", ".mkv", ".webm", ".m3u8"]
    const hasVideoExtension = videoExtensions.some((ext) => videoUrl.toLowerCase().includes(ext))

    if (!hasVideoExtension) {
      return NextResponse.json(
        {
          error: "URL does not appear to be a video file. Expected extensions: " + videoExtensions.join(", "),
        },
        { status: 400 },
      )
    }

    console.log("[v0] Video URL validated:", videoUrl)

    return NextResponse.json({
      success: true,
      message: "Video URL is valid. Duration will be extracted during transcription.",
    })
  } catch (error) {
    console.error("[v0] Error in video-info route:", error)
    return NextResponse.json({ error: "Failed to validate video URL" }, { status: 500 })
  }
}
