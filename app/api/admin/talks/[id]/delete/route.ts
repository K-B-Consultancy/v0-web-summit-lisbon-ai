import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { NextResponse } from "next/navigation"

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { error: segmentsError } = await supabase.from("transcript_segments").delete().eq("talk_id", id)

    if (segmentsError) {
      console.error("[v0] Error deleting transcript segments:", segmentsError)
    }

    // Delete talk
    const { error } = await supabase.from("talks").delete().eq("id", id)

    if (error) {
      console.error("[v0] Error deleting talk:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    revalidatePath("/admin")
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error in delete route:", error)
    return NextResponse.json({ error: "Failed to delete talk" }, { status: 500 })
  }
}
