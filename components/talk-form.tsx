"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Plus, X, Youtube } from "lucide-react"

interface Talk {
  id: string
  title: string
  speakers: string[]
  description: string | null
  video_url: string | null
  duration_minutes: number | null
  transcript_status: string | null
}

interface TalkFormProps {
  talk?: Talk
}

export function TalkForm({ talk }: TalkFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isFetchingVideo, setIsFetchingVideo] = useState(false)
  const [isGeneratingTranscript, setIsGeneratingTranscript] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: talk?.title || "",
    speakers: talk?.speakers || [""],
    description: talk?.description || "",
    video_url: talk?.video_url || "",
    duration_minutes: talk?.duration_minutes?.toString() || "",
  })

  useEffect(() => {
    if (formData.video_url && !talk) {
      fetchVideoDuration()
    }
  }, [formData.video_url])

  const fetchVideoDuration = async () => {
    if (!formData.video_url) return

    setIsFetchingVideo(true)
    try {
      console.log("[v0] Validating video URL:", formData.video_url)
      const response = await fetch("/api/admin/video-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoUrl: formData.video_url }),
      })

      const data = await response.json()

      if (!response.ok) {
        console.error("[v0] Video validation failed:", data.error)
        setError(data.error || "Unable to validate video URL")
        return
      }

      console.log("[v0] Video validated successfully:", data.message)
    } catch (err) {
      console.error("[v0] Error validating video:", err)
      setError("Failed to validate video URL. Please check the URL and try again.")
    } finally {
      setIsFetchingVideo(false)
    }
  }

  const addSpeaker = () => {
    setFormData({ ...formData, speakers: [...formData.speakers, ""] })
  }

  const removeSpeaker = (index: number) => {
    const newSpeakers = formData.speakers.filter((_, i) => i !== index)
    setFormData({ ...formData, speakers: newSpeakers.length > 0 ? newSpeakers : [""] })
  }

  const updateSpeaker = (index: number, value: string) => {
    const newSpeakers = [...formData.speakers]
    newSpeakers[index] = value
    setFormData({ ...formData, speakers: newSpeakers })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    // Filter out empty speakers
    const speakers = formData.speakers.filter((s) => s.trim() !== "")
    if (speakers.length === 0) {
      setError("Please add at least one speaker")
      setIsLoading(false)
      return
    }

    const data = {
      title: formData.title,
      speakers,
      description: formData.description || null,
      video_url: formData.video_url || null,
      duration_minutes: formData.duration_minutes ? Number.parseInt(formData.duration_minutes) : null,
      transcript_status: "pending",
    }

    let talkId = talk?.id

    if (talk) {
      // Update existing talk
      const { error: updateError } = await supabase.from("talks").update(data).eq("id", talk.id)

      if (updateError) {
        setError(updateError.message)
        setIsLoading(false)
        return
      }
    } else {
      // Create new talk
      const { data: newTalk, error: insertError } = await supabase.from("talks").insert(data).select().single()

      if (insertError) {
        setError(insertError.message)
        setIsLoading(false)
        return
      }

      talkId = newTalk.id
    }

    // Generate transcript if video URL is provided
    if (formData.video_url && talkId) {
      setIsGeneratingTranscript(true)
      try {
        await fetch("/api/admin/generate-transcript", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            talkId,
            videoUrl: formData.video_url,
            speakers: speakers, // Use the filtered speakers array
          }),
        })
      } catch (err) {
        console.error("Failed to generate transcript:", err)
      }
    }

    router.push("/admin")
    router.refresh()
  }

  return (
    <Card className="border-zinc-800 bg-zinc-950">
      <CardHeader>
        <CardTitle className="text-white">{talk ? "Edit Talk" : "Add New Talk"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="video_url" className="text-zinc-200">
              Video URL (AWS) *
            </Label>
            <div className="relative">
              <Input
                id="video_url"
                type="url"
                required
                placeholder="https://..."
                value={formData.video_url}
                onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                className="border-zinc-800 bg-zinc-900 text-white pl-10"
              />
              <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            </div>
            {isFetchingVideo && (
              <p className="text-xs text-zinc-400 flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                Fetching video information...
              </p>
            )}
            <p className="text-xs text-zinc-400">
              Paste a video URL from WebSummit (AWS). Transcript will be automatically generated.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title" className="text-zinc-200">
              Title *
            </Label>
            <Input
              id="title"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="border-zinc-800 bg-zinc-900 text-white"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-zinc-200">Speakers *</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addSpeaker}
                className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 bg-transparent"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Speaker
              </Button>
            </div>
            <div className="space-y-2">
              {formData.speakers.map((speaker, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    required
                    placeholder={`Speaker ${index + 1}`}
                    value={speaker}
                    onChange={(e) => updateSpeaker(index, e.target.value)}
                    className="border-zinc-800 bg-zinc-900 text-white"
                  />
                  {formData.speakers.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeSpeaker(index)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-950"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-zinc-200">
              Description
            </Label>
            <Textarea
              id="description"
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="border-zinc-800 bg-zinc-900 text-white resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration_minutes" className="text-zinc-200">
              Duration (minutes)
            </Label>
            <Input
              id="duration_minutes"
              type="number"
              min="1"
              value={formData.duration_minutes}
              onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
              className="border-zinc-800 bg-zinc-900 text-white"
            />
            <p className="text-xs text-zinc-400">Auto-filled from video, but you can edit it</p>
          </div>

          {error && <div className="text-sm text-red-400 bg-red-950/20 border border-red-900 rounded p-3">{error}</div>}

          {isGeneratingTranscript && (
            <div className="text-sm text-blue-400 bg-blue-950/20 border border-blue-900 rounded p-3 flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating transcript in the background. This may take a few minutes.
            </div>
          )}

          <div className="flex gap-4">
            <Button
              type="submit"
              disabled={isLoading || isGeneratingTranscript}
              className="bg-[#ff3366] hover:bg-[#e62958] text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>{talk ? "Update Talk" : "Create Talk"}</>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isLoading}
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
