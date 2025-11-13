-- Update talks table to support multiple speakers and better video handling
-- Remove the single speaker column and add a speakers array
ALTER TABLE talks DROP COLUMN IF EXISTS speaker;
ALTER TABLE talks ADD COLUMN IF NOT EXISTS speakers TEXT[] DEFAULT '{}';

-- Add processing status for transcript generation
ALTER TABLE talks ADD COLUMN IF NOT EXISTS transcript_status TEXT DEFAULT 'pending' CHECK (transcript_status IN ('pending', 'processing', 'completed', 'failed'));
ALTER TABLE talks ADD COLUMN IF NOT EXISTS transcript_error TEXT;

-- Update transcript_segments to link speaker names
ALTER TABLE transcript_segments ADD COLUMN IF NOT EXISTS speaker_name TEXT;
