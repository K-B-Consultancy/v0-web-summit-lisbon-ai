/**
 * Unit Test for Video Segment Selection Logic
 * 
 * This test validates that the generate-response API properly:
 * 1. Selects the correct video segment based on talk title mentions
 * 2. Selects the correct video segment based on timestamp mentions
 * 3. Falls back to first segment when no match is found
 * 4. Does not show video when AI indicates no information found
 * 
 * Run with: node app/api/generate-response/route.test.js
 */

console.log('🧪 Testing Video Segment Selection Logic...\n');

let testsPassed = 0;
let testsFailed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
    testsPassed++;
  } catch (error) {
    console.error(`❌ ${name}`);
    console.error(`   Error: ${error.message}`);
    testsFailed++;
  }
}

// Check if AI response indicates no information found
function hasNoInfo(aiResponseText) {
  const responseLower = aiResponseText.toLowerCase();
  const noInfoPhrases = [
    "don't have any specific information",
    "don't have information",
    "no specific information",
    "couldn't find",
    "no information",
    "no transcript segments",
    "no matching",
  ];
  return noInfoPhrases.some(phrase => responseLower.includes(phrase));
}

// Simulate the segment selection logic from route.ts
function selectSegment(segments, aiResponseText) {
  // Check if response indicates no info found - if so, return null
  if (hasNoInfo(aiResponseText)) {
    return { selectedSegment: null, matchFound: false, noInfo: true };
  }

  let selectedSegment = segments[0]; // Default to first
  let matchFound = false;
  
  for (const segment of segments) {
    const segmentTitle = segment.talkTitle?.toLowerCase() || '';
    const responseLower = aiResponseText.toLowerCase();
    
    // Check if this segment's talk title is mentioned in the response
    if (segmentTitle && responseLower.includes(segmentTitle)) {
      selectedSegment = segment;
      matchFound = true;
      break;
    }
    
    // Check if the timestamp is mentioned in various formats
    const mins = Math.floor(segment.startTime / 60);
    const secs = Math.floor(segment.startTime % 60);
    const timestampPattern1 = `${mins}:${String(secs).padStart(2, "0")}`; // e.g., "2:30"
    const timestampPattern2 = `${mins} minute${mins !== 1 ? 's' : ''}`; // e.g., "2 minutes"
    const timestampPattern3 = `${mins}m`; // e.g., "2m"
    
    if (responseLower.includes(timestampPattern1) || 
        (responseLower.includes(timestampPattern2) && responseLower.includes(`${secs} second`)) ||
        (responseLower.includes(timestampPattern3) && secs === 0)) {
      selectedSegment = segment;
      matchFound = true;
      break;
    }
  }
  
  return { selectedSegment, matchFound, noInfo: false };
}

// Test Data
const testSegments = [
  {
    talkId: "talk-1",
    talkTitle: "The Future of AI in Europe",
    videoUrl: "https://example.com/video1.mp4",
    startTime: 150, // 2:30
  },
  {
    talkId: "talk-2",
    talkTitle: "Blockchain Revolution",
    videoUrl: "https://example.com/video2.mp4",
    startTime: 300, // 5:00
  },
  {
    talkId: "talk-3",
    talkTitle: "Sustainability in Tech",
    videoUrl: "https://example.com/video3.mp4",
    startTime: 420, // 7:00
  },
];

// Test 1: Match by talk title
test('Should select segment when talk title is mentioned', () => {
  const response = "I found information about blockchain in 'Blockchain Revolution' talk.";
  const result = selectSegment(testSegments, response);
  
  if (result.noInfo) {
    throw new Error('Expected noInfo to be false');
  }
  if (result.selectedSegment.talkId !== "talk-2") {
    throw new Error(`Expected talk-2, got ${result.selectedSegment.talkId}`);
  }
  if (!result.matchFound) {
    throw new Error('Expected matchFound to be true');
  }
});

// Test 2: Match by timestamp (MM:SS format)
test('Should select segment when timestamp MM:SS is mentioned', () => {
  const response = "At 2:30 in the video, they discussed AI ethics.";
  const result = selectSegment(testSegments, response);
  
  if (result.selectedSegment.talkId !== "talk-1") {
    throw new Error(`Expected talk-1, got ${result.selectedSegment.talkId}`);
  }
  if (!result.matchFound) {
    throw new Error('Expected matchFound to be true');
  }
});

// Test 3: Match by timestamp (minutes/seconds format)
test('Should select segment when timestamp in minutes/seconds format is mentioned', () => {
  const response = "At 5 minutes 0 seconds into the video, they talked about blockchain.";
  const result = selectSegment(testSegments, response);
  
  if (result.selectedSegment.talkId !== "talk-2") {
    throw new Error(`Expected talk-2, got ${result.selectedSegment.talkId}`);
  }
  if (!result.matchFound) {
    throw new Error('Expected matchFound to be true');
  }
});

// Test 4: Match by timestamp (shorthand format)
test('Should select segment when timestamp in shorthand format is mentioned', () => {
  const response = "At 7m in the talk about sustainability...";
  const result = selectSegment(testSegments, response);
  
  if (result.selectedSegment.talkId !== "talk-3") {
    throw new Error(`Expected talk-3, got ${result.selectedSegment.talkId}`);
  }
  if (!result.matchFound) {
    throw new Error('Expected matchFound to be true');
  }
});

// Test 5: No match - fallback to first (when no "no info" phrase)
test('Should fallback to first segment when no match found and no "no info" phrase', () => {
  const response = "Here's some general information about the conference.";
  const result = selectSegment(testSegments, response);
  
  if (result.noInfo) {
    throw new Error('Expected noInfo to be false');
  }
  if (result.selectedSegment.talkId !== "talk-1") {
    throw new Error(`Expected talk-1 (first segment), got ${result.selectedSegment.talkId}`);
  }
  if (result.matchFound) {
    throw new Error('Expected matchFound to be false');
  }
});

// Test 6: Case insensitive matching
test('Should match talk title case-insensitively', () => {
  const response = "The FUTURE OF AI IN EUROPE talk discussed interesting points.";
  const result = selectSegment(testSegments, response);
  
  if (result.noInfo) {
    throw new Error('Expected noInfo to be false');
  }
  if (result.selectedSegment.talkId !== "talk-1") {
    throw new Error(`Expected talk-1, got ${result.selectedSegment.talkId}`);
  }
  if (!result.matchFound) {
    throw new Error('Expected matchFound to be true');
  }
});

// Test 7: First match wins when multiple segments mentioned
test('Should return first matching segment when multiple are mentioned', () => {
  const response = "Both 'The Future of AI in Europe' and 'Blockchain Revolution' covered interesting topics.";
  const result = selectSegment(testSegments, response);
  
  if (result.noInfo) {
    throw new Error('Expected noInfo to be false');
  }
  // Should match first title mentioned
  if (result.selectedSegment.talkId !== "talk-1") {
    throw new Error(`Expected talk-1 (first match), got ${result.selectedSegment.talkId}`);
  }
  if (!result.matchFound) {
    throw new Error('Expected matchFound to be true');
  }
});

// Test 8: No video when AI says no information found
test('Should not return video when AI indicates no information found', () => {
  const response = "It seems that I don't have any specific information or transcript segments about Khalid discussing mobility.";
  const result = selectSegment(testSegments, response);
  
  if (!result.noInfo) {
    throw new Error('Expected noInfo to be true');
  }
  if (result.selectedSegment !== null) {
    throw new Error('Expected selectedSegment to be null when no info found');
  }
  if (result.matchFound) {
    throw new Error('Expected matchFound to be false');
  }
});

// Test 9: No video with "couldn't find" phrase
test('Should not return video when AI says "couldn\'t find"', () => {
  const response = "I couldn't find any information about that topic in the available transcripts.";
  const result = selectSegment(testSegments, response);
  
  if (!result.noInfo) {
    throw new Error('Expected noInfo to be true');
  }
  if (result.selectedSegment !== null) {
    throw new Error('Expected selectedSegment to be null');
  }
});

// Print summary
console.log('\n' + '='.repeat(50));
console.log(`Tests Passed: ${testsPassed}`);
console.log(`Tests Failed: ${testsFailed}`);
console.log('='.repeat(50));

if (testsFailed > 0) {
  process.exit(1);
}
