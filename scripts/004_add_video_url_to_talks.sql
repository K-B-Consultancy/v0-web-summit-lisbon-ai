-- Add video_url column to talks table
ALTER TABLE talks ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Update existing talks with placeholder video URLs
UPDATE talks 
SET video_url = '/placeholder.mp4'
WHERE video_url IS NULL;

-- Add video URLs to sample talks
UPDATE talks 
SET video_url = CASE
  WHEN title ILIKE '%AI%' THEN 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
  WHEN title ILIKE '%Future%' THEN 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4'
  ELSE 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
END;
