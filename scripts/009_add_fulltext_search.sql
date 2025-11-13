-- Add full-text search support for transcript segments
-- This enables efficient searching of transcript content

-- Add a generated column for full-text search
ALTER TABLE transcript_segments 
  ADD COLUMN IF NOT EXISTS text_search tsvector 
  GENERATED ALWAYS AS (to_tsvector('english', text)) STORED;

-- Create an index on the search column for better performance
CREATE INDEX IF NOT EXISTS idx_transcript_segments_text_search 
  ON transcript_segments USING GIN (text_search);

-- Also add full-text search for talks
ALTER TABLE talks 
  ADD COLUMN IF NOT EXISTS search_vector tsvector 
  GENERATED ALWAYS AS (
    to_tsvector('english', 
      coalesce(title, '') || ' ' || 
      coalesce(description, '') || ' ' || 
      coalesce(array_to_string(speakers, ' '), '') || ' ' ||
      coalesce(array_to_string(tags, ' '), '')
    )
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_talks_search_vector 
  ON talks USING GIN (search_vector);
