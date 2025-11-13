# Database Setup Scripts

This directory contains SQL scripts for setting up and seeding the database.

## Script Execution Order

Run these scripts in order to set up a complete database:

1. **001_create_database_schema.sql** - Creates core tables (profiles, talks, messages)
2. **002_profile_trigger.sql** - Sets up automatic profile creation
3. **003_seed_sample_talks.sql** - Seeds sample talks for testing
4. **004_add_video_url_to_talks.sql** - Adds video_url column (if not already present)
5. **005_add_transcript_segments.sql** - Creates transcript_segments table
6. **006_update_talks_for_multiple_speakers.sql** - Updates talks schema for multiple speakers
7. **007_simplify_rls_for_admin.sql** - Simplifies RLS policies
8. **008_seed_transcript_segments.sql** - Seeds sample transcript data for timestamp testing
9. **009_add_fulltext_search.sql** - Adds full-text search indexes for better performance

## How to Run (Supabase SQL Editor)

1. Log into your Supabase project
2. Go to the SQL Editor
3. Copy and paste each script in order
4. Click "Run" to execute

## How to Run (Command Line)

```bash
# Using psql
psql -h <host> -U <user> -d <database> -f scripts/001_create_database_schema.sql
psql -h <host> -U <user> -d <database> -f scripts/002_profile_trigger.sql
# ... and so on
```

## Key Features Added

### Transcript Segments (Script 005, 008)
- Stores time-stamped segments from video transcripts
- Enables timestamp-based video playback
- Supports speaker identification
- Sample data includes realistic AI, sustainability, and blockchain content

### Full-Text Search (Script 009)
- Enables efficient searching across transcript text
- Adds search indexes for talks (title, description, speakers, tags)
- Uses PostgreSQL's built-in full-text search capabilities

## Testing the Timestamp Feature

After running all scripts, you can test the timestamp feature with queries like:

```sql
-- Find all segments mentioning "AI"
SELECT 
  t.title,
  ts.start_seconds,
  ts.end_seconds,
  ts.speaker_name,
  ts.text
FROM transcript_segments ts
JOIN talks t ON ts.talk_id = t.id
WHERE ts.text_search @@ to_tsquery('english', 'AI');

-- Or using the simpler textSearch (used by the API)
SELECT * FROM transcript_segments 
WHERE text @@ to_tsquery('AI | artificial | intelligence')
LIMIT 5;
```

## Sample Queries for the Chat AI

Once the database is seeded, try these queries in the chat interface:

- "What did they say about AI?"
- "Find moments about sustainability"
- "Tell me about blockchain applications"
- "What talks mention machine learning?"
- "Show me the part about healthcare AI"

The AI will return responses with specific timestamps that users can click to watch.
