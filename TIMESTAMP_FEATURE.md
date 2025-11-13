# Video Timestamp Feature Guide

## Overview

The AI chat interface now supports finding and displaying specific moments from Web Summit talks using timestamps. This allows you to ask questions about talk content and get references to exact moments in the videos.

## How It Works

### 1. Ask Natural Questions

Instead of browsing through entire videos, you can ask the AI specific questions:

- "What did they say about AI?"
- "Find moments about sustainability"
- "Tell me about blockchain applications"
- "What talks mention machine learning?"
- "Show me the part about healthcare AI"

### 2. Get Timestamp References

The AI will search through all talk transcripts and return:
- The exact timestamp where the topic is discussed (e.g., "At 2:30...")
- The talk title and speaker
- A quote or summary of what was said
- Option to watch the video at that specific moment

### 3. Example Response

```
User: "What did they say about AI?"

AI: "I found several mentions of AI in our talks. Here are some highlights:

1. At 2:00 in 'The Future of AI in Europe' by Dr. Maria Silva:
   'Europe is taking a unique approach to AI development, one that 
   prioritizes ethical frameworks and human rights.'

2. At 6:20 in the same talk:
   'In healthcare, AI is revolutionizing early disease detection. 
   European researchers have developed models that can detect 
   cancer with 95% accuracy.'

Would you like me to show you the video at any of these timestamps?"
```

## Quick Actions

When you first open the chat, you'll see suggested quick actions that demonstrate this feature:

- **"What talks are available?"** - Browse all talks
- **"What did they say about AI?"** - Find AI-related moments with timestamps
- **"Find moments about sustainability"** - Search for sustainability topics
- **"Show me the keynote talk"** - Request a specific talk video

## For Developers

### Database Schema

The feature relies on the `transcript_segments` table:

```sql
CREATE TABLE transcript_segments (
  id UUID PRIMARY KEY,
  talk_id UUID REFERENCES talks(id),
  start_seconds DECIMAL(10, 2),
  end_seconds DECIMAL(10, 2),
  speaker_label TEXT,
  speaker_name TEXT,
  text TEXT,
  text_search tsvector  -- Full-text search index
);
```

### API Endpoints

Two main endpoints support this feature:

1. **`/api/fetch-talks`** - Searches transcripts based on query keywords
2. **`/api/generate-response`** - Formats AI responses with timestamps
3. **`/api/chat`** - Advanced endpoint with tools (searchTranscripts, showVideo, getTalks)

### System Prompts

The AI is instructed to:
- Always include timestamps when referencing transcript content
- Format timestamps as MM:SS for clarity
- Offer to show videos at specific timestamps
- Use the showVideo tool when appropriate

## Setup Requirements

To enable this feature, your database must have:

1. Talks with `status = 'published'`
2. Transcript segments linked to those talks
3. Full-text search indexes (optional but recommended for performance)

Run these scripts in order:
```bash
# Core schema
001_create_database_schema.sql
...
005_add_transcript_segments.sql

# Seed data for testing
008_seed_transcript_segments.sql

# Performance optimization
009_add_fulltext_search.sql
```

See `scripts/README.md` for complete setup instructions.

## Benefits

### For Users
- **Faster discovery**: Find relevant content without watching entire videos
- **Precise references**: Jump to exact moments of interest
- **Better learning**: Review specific topics or quotes easily

### For Organizers
- **Increased engagement**: Users spend more time with content
- **Better insights**: Track which topics users search for most
- **Improved accessibility**: Makes long-form content more digestible

## Future Enhancements

Potential improvements to consider:
- Auto-generate transcripts from uploaded videos
- Support for multiple languages
- Chapter markers and topic tags
- Share specific timestamp links
- Playlist creation from searched moments
