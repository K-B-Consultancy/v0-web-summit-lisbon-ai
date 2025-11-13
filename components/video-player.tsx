"use client"

import { useEffect, useRef } from "react"

interface VideoPlayerProps {
  talkId: string
  title: string
  videoUrl: string
  startTime?: number
}

export function VideoPlayer({ talkId, title, videoUrl, startTime = 0 }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current && startTime > 0) {
      videoRef.current.currentTime = startTime
    }
  }, [startTime])

  return (
    <div className="rounded-lg overflow-hidden border border-zinc-800 bg-zinc-900">
      <div className="aspect-video relative bg-black">
        <video
          ref={videoRef}
          className="w-full h-full"
          controls
          src={videoUrl}
          poster={`/placeholder.svg?height=720&width=1280&query=${encodeURIComponent(title)}`}
        >
          <track kind="captions" />
        </video>
      </div>
      <div className="p-4 border-t border-zinc-800">
        <h3 className="font-semibold text-white text-sm">{title}</h3>
        {startTime > 0 && (
          <p className="text-xs text-zinc-500 mt-1">
            Starting at {Math.floor(startTime / 60)}:{String(Math.floor(startTime % 60)).padStart(2, "0")}
          </p>
        )}
      </div>
    </div>
  )
}
