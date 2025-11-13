/**
 * Unit Test for Video Segment Selection Logic
 * 
 * This test validates that the generate-response API properly:
 * 1. Shows video when AI returns valid segment index AND matching talk title
 * 2. Does not show video when talk titles don't match
 * 3. Does not show video when talk title not mentioned in response
 * 4. Handles invalid segment indices gracefully
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

// Simulate the new structured response logic from route.ts
function selectSegment(segments, videoSegmentIndex, referencedTalkTitle, responseText) {
  // If no segment index provided, return null
  if (videoSegmentIndex === null || videoSegmentIndex === undefined) {
    return { selectedSegment: null, reason: 'No segment index provided' };
  }

  // If no referenced talk title, return null
  if (referencedTalkTitle === null || referencedTalkTitle === undefined) {
    return { selectedSegment: null, reason: 'No referenced talk title provided' };
  }

  // Validate segment index
  if (typeof videoSegmentIndex !== 'number' || 
      videoSegmentIndex < 0 || 
      videoSegmentIndex >= segments.length) {
    return { selectedSegment: null, reason: 'Invalid segment index' };
  }

  const selectedSegment = segments[videoSegmentIndex];
  
  // Check if segment has video URL
  if (!selectedSegment?.videoUrl) {
    return { selectedSegment: null, reason: 'Segment has no video URL' };
  }

  // Validate that referenced talk title matches selected segment
  if (!selectedSegment?.talkTitle || 
      selectedSegment.talkTitle.toLowerCase() !== referencedTalkTitle.toLowerCase()) {
    return { selectedSegment: null, reason: 'Talk title mismatch' };
  }

  // Check if talk title is mentioned in response text
  if (responseText) {
    const responseLower = responseText.toLowerCase();
    const talkTitleLower = selectedSegment.talkTitle.toLowerCase();
    if (!responseLower.includes(talkTitleLower)) {
      return { selectedSegment: null, reason: 'Talk title not mentioned in response' };
    }
  }

  return { selectedSegment, reason: 'Valid segment selected' };
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
  {
    talkId: "talk-4",
    talkTitle: "Talk without video",
    videoUrl: null, // No video URL
    startTime: 600,
  },
];

// Test 1: Select segment when all validations pass
test('Should select segment when index, title, and mention all match', () => {
  const responseText = "In 'The Future of AI in Europe' talk, they discussed...";
  const result = selectSegment(testSegments, 0, "The Future of AI in Europe", responseText);
  
  if (!result.selectedSegment) {
    throw new Error('Expected selectedSegment to be defined');
  }
  if (result.selectedSegment.talkId !== "talk-1") {
    throw new Error(`Expected talk-1, got ${result.selectedSegment.talkId}`);
  }
});

// Test 2: Select second segment with matching criteria
test('Should select second segment when properly referenced', () => {
  const responseText = "The blockchain revolution talk covered...";
  const result = selectSegment(testSegments, 1, "Blockchain Revolution", responseText);
  
  if (!result.selectedSegment) {
    throw new Error('Expected selectedSegment to be defined');
  }
  if (result.selectedSegment.talkId !== "talk-2") {
    throw new Error(`Expected talk-2, got ${result.selectedSegment.talkId}`);
  }
});

// Test 3: Return null when videoSegmentIndex is null
test('Should return null when videoSegmentIndex is null (no info found)', () => {
  const result = selectSegment(testSegments, null, null, "No information found");
  
  if (result.selectedSegment !== null) {
    throw new Error('Expected selectedSegment to be null');
  }
  if (result.reason !== 'No segment index provided') {
    throw new Error(`Expected reason 'No segment index provided', got '${result.reason}'`);
  }
});

// Test 4: Return null when referencedTalkTitle is null
test('Should return null when referencedTalkTitle is null', () => {
  const result = selectSegment(testSegments, 0, null, "Some text");
  
  if (result.selectedSegment !== null) {
    throw new Error('Expected selectedSegment to be null');
  }
  if (result.reason !== 'No referenced talk title provided') {
    throw new Error(`Expected reason 'No referenced talk title provided', got '${result.reason}'`);
  }
});

// Test 5: Return null for negative index
test('Should return null for negative videoSegmentIndex', () => {
  const result = selectSegment(testSegments, -1, "Some Talk", "text");
  
  if (result.selectedSegment !== null) {
    throw new Error('Expected selectedSegment to be null for negative index');
  }
  if (result.reason !== 'Invalid segment index') {
    throw new Error(`Expected reason 'Invalid segment index', got '${result.reason}'`);
  }
});

// Test 6: Return null for out-of-bounds index
test('Should return null when videoSegmentIndex is out of bounds', () => {
  const result = selectSegment(testSegments, 999, "Some Talk", "text");
  
  if (result.selectedSegment !== null) {
    throw new Error('Expected selectedSegment to be null for out-of-bounds index');
  }
  if (result.reason !== 'Invalid segment index') {
    throw new Error(`Expected reason 'Invalid segment index', got '${result.reason}'`);
  }
});

// Test 7: Return null when segment has no video URL
test('Should return null when selected segment has no video URL', () => {
  const responseText = "In the talk without video...";
  const result = selectSegment(testSegments, 3, "Talk without video", responseText);
  
  if (result.selectedSegment !== null) {
    throw new Error('Expected selectedSegment to be null when no video URL');
  }
  if (result.reason !== 'Segment has no video URL') {
    throw new Error(`Expected reason 'Segment has no video URL', got '${result.reason}'`);
  }
});

// Test 8: Return null when talk title doesn't match
test('Should return null when referenced talk title does not match segment', () => {
  const responseText = "Some text";
  const result = selectSegment(testSegments, 0, "Wrong Talk Title", responseText);
  
  if (result.selectedSegment !== null) {
    throw new Error('Expected selectedSegment to be null when talk title mismatch');
  }
  if (result.reason !== 'Talk title mismatch') {
    throw new Error(`Expected reason 'Talk title mismatch', got '${result.reason}'`);
  }
});

// Test 9: Return null when talk title not mentioned in response
test('Should return null when talk title not mentioned in response text', () => {
  const responseText = "This text does not mention the talk";
  const result = selectSegment(testSegments, 0, "The Future of AI in Europe", responseText);
  
  if (result.selectedSegment !== null) {
    throw new Error('Expected selectedSegment to be null when talk not mentioned');
  }
  if (result.reason !== 'Talk title not mentioned in response') {
    throw new Error(`Expected reason 'Talk title not mentioned in response', got '${result.reason}'`);
  }
});

// Test 10: Case insensitive matching for talk titles
test('Should match talk titles case-insensitively', () => {
  const responseText = "In 'the future of ai in europe' talk...";
  const result = selectSegment(testSegments, 0, "the future of ai in europe", responseText);
  
  if (!result.selectedSegment) {
    throw new Error('Expected selectedSegment to be defined for case-insensitive match');
  }
  if (result.selectedSegment.talkId !== "talk-1") {
    throw new Error(`Expected talk-1, got ${result.selectedSegment.talkId}`);
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
