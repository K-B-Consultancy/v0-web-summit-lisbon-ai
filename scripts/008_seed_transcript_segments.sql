-- Seed sample transcript segments for testing timestamp features
-- This script assumes talks from 003_seed_sample_talks.sql exist

-- First, let's add some sample transcript segments for "The Future of AI in Europe"
-- We'll use the talk title to find the ID since we don't know the UUID
DO $$
DECLARE
  ai_talk_id UUID;
  sustainable_talk_id UUID;
  blockchain_talk_id UUID;
BEGIN
  -- Get talk IDs
  SELECT id INTO ai_talk_id FROM talks WHERE title = 'The Future of AI in Europe' LIMIT 1;
  SELECT id INTO sustainable_talk_id FROM talks WHERE title = 'Building Sustainable Tech Startups' LIMIT 1;
  SELECT id INTO blockchain_talk_id FROM talks WHERE title = 'Blockchain Beyond Crypto' LIMIT 1;

  -- Only insert if talks exist
  IF ai_talk_id IS NOT NULL THEN
    -- Transcript segments for "The Future of AI in Europe"
    INSERT INTO transcript_segments (talk_id, start_seconds, end_seconds, speaker_label, speaker_name, text) VALUES
      (ai_talk_id, 0, 45, 'Speaker 1', 'Dr. Maria Silva', 'Welcome everyone to Web Summit Lisbon 2025. Today we''re going to explore the future of artificial intelligence in Europe.'),
      (ai_talk_id, 45, 120, 'Speaker 1', 'Dr. Maria Silva', 'Europe is taking a unique approach to AI development, one that prioritizes ethical frameworks and human rights. This is crucial for building trust in AI systems.'),
      (ai_talk_id, 120, 210, 'Speaker 1', 'Dr. Maria Silva', 'Let me share some exciting developments. European AI startups have raised over 15 billion euros in the past year alone, focusing on healthcare, climate tech, and education.'),
      (ai_talk_id, 210, 290, 'Speaker 1', 'Dr. Maria Silva', 'Machine learning models trained on diverse European datasets are showing remarkable results in multilingual applications and cultural understanding.'),
      (ai_talk_id, 290, 380, 'Speaker 1', 'Dr. Maria Silva', 'The EU AI Act is setting a global standard for responsible AI governance. Companies worldwide are looking to Europe for guidance on ethical AI deployment.'),
      (ai_talk_id, 380, 450, 'Speaker 1', 'Dr. Maria Silva', 'In healthcare, AI is revolutionizing early disease detection. European researchers have developed models that can detect cancer with 95% accuracy.'),
      (ai_talk_id, 450, 520, 'Speaker 1', 'Dr. Maria Silva', 'Climate change is another area where AI is making a massive impact. We''re using machine learning to optimize renewable energy grids and predict weather patterns.'),
      (ai_talk_id, 520, 600, 'Speaker 1', 'Dr. Maria Silva', 'For startups, the key is to focus on solving real problems. Don''t build AI for the sake of AI. Find genuine use cases where AI can create value.');
  END IF;

  IF sustainable_talk_id IS NOT NULL THEN
    -- Transcript segments for "Building Sustainable Tech Startups"
    INSERT INTO transcript_segments (talk_id, start_seconds, end_seconds, speaker_label, speaker_name, text) VALUES
      (sustainable_talk_id, 0, 60, 'Speaker 1', 'João Santos', 'Thank you for joining me today. Building a sustainable startup isn''t just about being green - it''s about creating long-term value for everyone.'),
      (sustainable_talk_id, 60, 150, 'Speaker 1', 'João Santos', 'Sustainability means different things to different companies. For tech startups, it includes environmental impact, social responsibility, and economic viability.'),
      (sustainable_talk_id, 150, 240, 'Speaker 1', 'João Santos', 'The circular economy is a huge opportunity. We''re seeing startups that design products for reuse, recycling, and minimal waste from day one.'),
      (sustainable_talk_id, 240, 330, 'Speaker 1', 'João Santos', 'Climate tech is attracting record investment. From carbon capture to sustainable agriculture, investors are betting big on solutions to the climate crisis.'),
      (sustainable_talk_id, 330, 420, 'Speaker 1', 'João Santos', 'Don''t underestimate the power of transparency. Customers and investors want to see real impact metrics, not just marketing claims about sustainability.');
  END IF;

  IF blockchain_talk_id IS NOT NULL THEN
    -- Transcript segments for "Blockchain Beyond Crypto"
    INSERT INTO transcript_segments (talk_id, start_seconds, end_seconds, speaker_label, speaker_name, text) VALUES
      (blockchain_talk_id, 0, 55, 'Speaker 1', 'Anna Kowalski', 'Good afternoon everyone. While crypto gets all the headlines, blockchain technology has far more practical applications.'),
      (blockchain_talk_id, 55, 140, 'Speaker 1', 'Anna Kowalski', 'Supply chain management is being transformed by blockchain. Companies can now track products from manufacture to delivery with complete transparency.'),
      (blockchain_talk_id, 140, 230, 'Speaker 1', 'Anna Kowalski', 'Healthcare records are another perfect use case. Blockchain enables secure, patient-controlled health data that can be shared across providers safely.'),
      (blockchain_talk_id, 230, 310, 'Speaker 1', 'Anna Kowalski', 'Smart contracts are automating complex business processes. From insurance claims to real estate transactions, blockchain is reducing costs and fraud.'),
      (blockchain_talk_id, 310, 400, 'Speaker 1', 'Anna Kowalski', 'Digital identity is crucial for the future. Blockchain-based identity systems give people control over their personal data while enabling secure verification.');
  END IF;
END $$;
