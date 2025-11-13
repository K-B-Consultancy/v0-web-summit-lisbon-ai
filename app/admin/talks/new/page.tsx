import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { TalkForm } from "@/components/talk-form"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default async function NewTalkPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/admin/login")
  }

  // All authenticated users in /admin are admins

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
              <div className="text-xs text-zinc-400">ADD TALK</div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <TalkForm />
      </main>
    </div>
  )
}
