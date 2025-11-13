import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { TalkForm } from "@/components/talk-form"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditTalkPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/admin/login")
  }

  // All authenticated users in /admin are admins

  // Fetch talk
  const { data: talk, error } = await supabase.from("talks").select("*").eq("id", id).single()

  if (error || !talk) {
    redirect("/admin")
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <header className="border-b border-zinc-800 bg-zinc-950/50 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost" size="sm" className="text-zinc-300 hover:bg-zinc-800">
              <Link href="/admin">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Link>
            </Button>
            <div>
              <div className="text-lg font-bold text-[#ff3366]">WEB SUMMIT</div>
              <div className="text-xs text-zinc-400">EDIT TALK</div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {talk.transcript_status === "completed" && (
          <div className="mb-6">
            <TranscriptPreview talkId={talk.id} speakers={talk.speakers || []} />
          </div>
        )}
        <TalkForm talk={talk} />
      </main>
    </div>
  )
}

async function TranscriptPreview({ talkId, speakers }: { talkId: string; speakers: string[] }) {
  const supabase = await createClient()
  const { data: segments, count } = await supabase
    .from("transcript_segments")
    .select("*", { count: "exact" })
    .eq("talk_id", talkId)
    .order("start_seconds", { ascending: true })
    .limit(5)

  return (
    <Card className="border-zinc-800 bg-zinc-950">
      <CardHeader>
        <CardTitle className="text-white">Transcript Segments</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-zinc-400 mb-4">{count || 0} segments available. Preview of first 5 segments:</p>
        {segments && segments.length > 0 ? (
          <div className="space-y-2">
            {segments.map((seg) => (
              <div key={seg.id} className="text-sm text-zinc-300 border border-zinc-800 rounded p-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-zinc-500">
                    {Math.floor(seg.start_seconds / 60)}:
                    {Math.floor(seg.start_seconds % 60)
                      .toString()
                      .padStart(2, "0")}
                  </span>
                  <span className="text-[#ff3366]">{seg.speaker_name || seg.speaker_label || "Unassigned"}</span>
                </div>
                <p>
                  {seg.text.substring(0, 100)}
                  {seg.text.length > 100 ? "..." : ""}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-zinc-500">No transcript segments found yet.</p>
        )}
      </CardContent>
    </Card>
  )
}
