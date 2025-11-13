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

  // Create a URL with timestamp for opening in new tab
  const getVideoUrlWithTimestamp = () => {
    try {
      const url = new URL(videoUrl)
      if (startTime > 0) {
        // For YouTube URLs, add the time parameter
        if (url.hostname.includes('youtube.com') || url.hostname.includes('youtu.be')) {
          url.searchParams.set('t', Math.floor(startTime).toString())
        }
      }
      return url.toString()
    } catch {
      return videoUrl
    }
  }

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
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <h3 className="font-semibold text-white text-sm">{title}</h3>
            {startTime > 0 && (
              <p className="text-xs text-zinc-500 mt-1">
                Starting at {Math.floor(startTime / 60)}:{String(Math.floor(startTime % 60)).padStart(2, "0")}
              </p>
            )}
          </div>
          <a
            href={getVideoUrlWithTimestamp()}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[#ff3366] hover:text-[#ff4477] flex items-center gap-1 whitespace-nowrap"
          >
            Open in new tab
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
          </a>
        </div>
      </div>
    </div>
  )
}
