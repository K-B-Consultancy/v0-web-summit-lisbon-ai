import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, Plus, Trash2, Edit, LogOut } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function AdminPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/admin/login")
  }

  async function handleSignOut() {
    "use server"
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect("/admin/login")
  }

  // Fetch all talks
  const { data: talks } = await supabase.from("talks").select("*").order("created_at", { ascending: false })

  // Fetch stats
  const { count: totalTalks } = await supabase.from("talks").select("*", { count: "exact", head: true })

  const { count: totalMessages } = await supabase.from("messages").select("*", { count: "exact", head: true })

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-950/50 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost" size="sm" className="text-zinc-300 hover:bg-zinc-800">
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Link>
            </Button>
            <div>
              <div className="text-lg font-bold text-[#ff3366]">WEB SUMMIT</div>
              <div className="text-xs text-zinc-400">ADMIN DASHBOARD</div>
            </div>
          </div>
          <form action={handleSignOut}>
            <Button type="submit" variant="ghost" size="sm" className="text-zinc-300 hover:bg-zinc-800">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </form>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-2 mb-8">
          <Card className="border-zinc-800 bg-zinc-950">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-zinc-400">Total Talks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{totalTalks || 0}</div>
            </CardContent>
          </Card>
          <Card className="border-zinc-800 bg-zinc-950">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-zinc-400">Total Messages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{totalMessages || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Talks Management */}
        <Card className="border-zinc-800 bg-zinc-950">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white">Manage Talks</CardTitle>
            <Button asChild size="sm" className="bg-[#ff3366] hover:bg-[#e62958] text-white">
              <Link href="/admin/talks/new">
                <Plus className="h-4 w-4 mr-2" />
                Add Talk
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-zinc-900">
                  <TableHead className="text-zinc-400">Title</TableHead>
                  <TableHead className="text-zinc-400">Speakers</TableHead>
                  <TableHead className="text-zinc-400 hidden md:table-cell">Duration</TableHead>
                  <TableHead className="text-zinc-400 hidden lg:table-cell">Transcript</TableHead>
                  <TableHead className="text-zinc-400 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {talks && talks.length > 0 ? (
                  talks.map((talk) => (
                    <TableRow key={talk.id} className="border-zinc-800 hover:bg-zinc-900">
                      <TableCell className="font-medium text-white">{talk.title}</TableCell>
                      <TableCell className="text-zinc-300">
                        {talk.speakers && talk.speakers.length > 0 ? talk.speakers.join(", ") : "N/A"}
                      </TableCell>
                      <TableCell className="text-zinc-300 hidden md:table-cell">
                        {talk.duration_minutes ? `${talk.duration_minutes} min` : "N/A"}
                      </TableCell>
                      <TableCell className="text-zinc-300 hidden lg:table-cell">
                        {talk.transcript_status === "completed" && <span className="text-green-400">✓ Ready</span>}
                        {talk.transcript_status === "processing" && (
                          <span className="text-yellow-400">⟳ Processing</span>
                        )}
                        {talk.transcript_status === "pending" && <span className="text-zinc-500">○ Pending</span>}
                        {talk.transcript_status === "failed" && <span className="text-red-400">✗ Failed</span>}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            asChild
                            variant="ghost"
                            size="icon"
                            className="text-zinc-400 hover:text-white hover:bg-zinc-800"
                          >
                            <Link href={`/admin/talks/${talk.id}/edit`}>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                          <form action={`/api/admin/talks/${talk.id}/delete`} method="POST">
                            <Button
                              type="submit"
                              variant="ghost"
                              size="icon"
                              className="text-red-400 hover:text-red-300 hover:bg-red-950"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </form>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow className="border-zinc-800">
                    <TableCell colSpan={5} className="text-center text-zinc-500 py-8">
                      No talks found. Add your first talk!
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
