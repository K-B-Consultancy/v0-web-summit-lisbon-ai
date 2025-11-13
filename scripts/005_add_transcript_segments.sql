-- Add transcript segments table
CREATE TABLE IF NOT EXISTS transcript_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  talk_id UUID NOT NULL REFERENCES talks(id) ON DELETE CASCADE,
  start_seconds DECIMAL(10, 2) NOT NULL,
  end_seconds DECIMAL(10, 2) NOT NULL,
  speaker_label TEXT DEFAULT 'Speaker',
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_transcript_segments_talk_id ON transcript_segments(talk_id);
CREATE INDEX IF NOT EXISTS idx_transcript_segments_time ON transcript_segments(talk_id, start_seconds);

-- Enable RLS
ALTER TABLE transcript_segments ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read transcript segments (public access)
CREATE POLICY "Allow public read access to transcript segments"
  ON transcript_segments
  FOR SELECT
  TO public
  USING (true);

-- Allow authenticated users to insert/update/delete transcript segments (admin only)
CREATE POLICY "Allow authenticated users to manage transcript segments"
  ON transcript_segments
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Add status field to talks table for draft/published
ALTER TABLE talks ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published'));
ALTER TABLE talks ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en';
ALTER TABLE talks ADD COLUMN IF NOT EXISTS stage TEXT;
ALTER TABLE talks ADD COLUMN IF NOT EXISTS event_date TIMESTAMPTZ;
ALTER TABLE talks ADD COLUMN IF NOT EXISTS tags TEXT[];
ALTER TABLE talks ADD COLUMN IF NOT EXISTS source_id TEXT;
