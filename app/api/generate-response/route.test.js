/**
 * Unit Test for Video Segment Selection Logic
 * 
 * This test validates that the generate-response API properly:
 * 1. Shows video when AI returns a valid segment index
 * 2. Does not show video when AI returns null segment index
 * 3. Handles invalid segment indices gracefully
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
function selectSegment(segments, videoSegmentIndex) {
  // If no segment index provided, return null
  if (videoSegmentIndex === null || videoSegmentIndex === undefined) {
    return { selectedSegment: null, reason: 'No segment index provided' };
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

// Test 1: Select first segment when index is 0
test('Should select first segment when videoSegmentIndex is 0', () => {
  const result = selectSegment(testSegments, 0);
  
  if (!result.selectedSegment) {
    throw new Error('Expected selectedSegment to be defined');
  }
  if (result.selectedSegment.talkId !== "talk-1") {
    throw new Error(`Expected talk-1, got ${result.selectedSegment.talkId}`);
  }
});

// Test 2: Select second segment when index is 1
test('Should select second segment when videoSegmentIndex is 1', () => {
  const result = selectSegment(testSegments, 1);
  
  if (!result.selectedSegment) {
    throw new Error('Expected selectedSegment to be defined');
  }
  if (result.selectedSegment.talkId !== "talk-2") {
    throw new Error(`Expected talk-2, got ${result.selectedSegment.talkId}`);
  }
});

// Test 3: Select third segment when index is 2
test('Should select third segment when videoSegmentIndex is 2', () => {
  const result = selectSegment(testSegments, 2);
  
  if (!result.selectedSegment) {
    throw new Error('Expected selectedSegment to be defined');
  }
  if (result.selectedSegment.talkId !== "talk-3") {
    throw new Error(`Expected talk-3, got ${result.selectedSegment.talkId}`);
  }
});

// Test 4: Return null when videoSegmentIndex is null
test('Should return null when videoSegmentIndex is null (no info found)', () => {
  const result = selectSegment(testSegments, null);
  
  if (result.selectedSegment !== null) {
    throw new Error('Expected selectedSegment to be null');
  }
  if (result.reason !== 'No segment index provided') {
    throw new Error(`Expected reason 'No segment index provided', got '${result.reason}'`);
  }
});

// Test 5: Return null when videoSegmentIndex is undefined
test('Should return null when videoSegmentIndex is undefined', () => {
  const result = selectSegment(testSegments, undefined);
  
  if (result.selectedSegment !== null) {
    throw new Error('Expected selectedSegment to be null');
  }
});

// Test 6: Return null for negative index
test('Should return null for negative videoSegmentIndex', () => {
  const result = selectSegment(testSegments, -1);
  
  if (result.selectedSegment !== null) {
    throw new Error('Expected selectedSegment to be null for negative index');
  }
  if (result.reason !== 'Invalid segment index') {
    throw new Error(`Expected reason 'Invalid segment index', got '${result.reason}'`);
  }
});

// Test 7: Return null for out-of-bounds index
test('Should return null when videoSegmentIndex is out of bounds', () => {
  const result = selectSegment(testSegments, 999);
  
  if (result.selectedSegment !== null) {
    throw new Error('Expected selectedSegment to be null for out-of-bounds index');
  }
  if (result.reason !== 'Invalid segment index') {
    throw new Error(`Expected reason 'Invalid segment index', got '${result.reason}'`);
  }
});

// Test 8: Return null when segment has no video URL
test('Should return null when selected segment has no video URL', () => {
  const result = selectSegment(testSegments, 3); // talk-4 has no video
  
  if (result.selectedSegment !== null) {
    throw new Error('Expected selectedSegment to be null when no video URL');
  }
  if (result.reason !== 'Segment has no video URL') {
    throw new Error(`Expected reason 'Segment has no video URL', got '${result.reason}'`);
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
