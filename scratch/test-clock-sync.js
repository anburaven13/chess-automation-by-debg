// Deterministic Validator for Clock Parsing & Delay Math
const fs = require('fs');
const assert = require('assert');

// 1. Verify JS file syntax
try {
  new Function(fs.readFileSync('c:/Users/USER/Documents/antigravity/qwen-web-agent/content.js', 'utf8'));
  new Function(fs.readFileSync('c:/Users/USER/Documents/antigravity/qwen-web-agent/popup.js', 'utf8'));
  new Function(fs.readFileSync('c:/Users/USER/Documents/antigravity/qwen-web-agent/background.js', 'utf8'));
  console.log('✓ Syntax Check Passed for all files.');
} catch (e) {
  console.error('✗ Syntax Check Failed:', e);
  process.exit(1);
}

// 2. Extracted pure logic for unit testing
function parseClockSecondsFromText(text) {
  const match = text.trim().match(/(\d+):(\d+)(?::(\d+))?(?:\.(\d+))?/);
  if (!match) return null;
  if (match[3] !== undefined) {
    const h = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    const s = parseInt(match[3], 10);
    const ms = match[4] ? parseFloat("0." + match[4]) : 0;
    return h * 3600 + m * 60 + s + ms;
  } else {
    const m = parseInt(match[1], 10);
    const s = parseInt(match[2], 10);
    const ms = match[4] ? parseFloat("0." + match[4]) : 0;
    return m * 60 + s + ms;
  }
}

function testComputeMoveDelay(mySec, oppSec, syncClock) {
  const baseDelay = 1500;
  if (!syncClock) return baseDelay;
  if (mySec === null || oppSec === null) return baseDelay;

  // Emergency low time
  if (mySec < 25 || oppSec < 20) {
    return 800; // rapid
  }

  const bufferSeconds = 10;
  const targetMySeconds = oppSec + bufferSeconds;

  if (mySec > targetMySeconds) {
    const secondsToBurn = mySec - targetMySeconds;
    const delayMs = Math.min(secondsToBurn * 1000, 30000);
    return Math.max(delayMs, baseDelay);
  }

  return baseDelay;
}

// Tests for parseClockSeconds
assert.strictEqual(parseClockSecondsFromText('8:30'), 510, '8:30 should be 510s');
assert.strictEqual(parseClockSecondsFromText('08:30'), 510, '08:30 should be 510s');
assert.strictEqual(parseClockSecondsFromText('10:00'), 600, '10:00 should be 600s');
assert.strictEqual(parseClockSecondsFromText('1:02:15'), 3735, '1:02:15 should be 3735s');
assert.strictEqual(parseClockSecondsFromText('0:15.5'), 15.5, '0:15.5 should be 15.5s');
assert.strictEqual(parseClockSecondsFromText('invalid'), null, 'invalid text should be null');
console.log('✓ Clock Parsing Unit Tests Passed.');

// Tests for delay calculation
// Case A: User is at 9:15 (555s), Opponent is at 8:30 (510s). Target is 8:40 (520s). Difference = 35s -> Capped at 30s = 30000ms.
const delayA = testComputeMoveDelay(555, 510, true);
assert.strictEqual(delayA, 30000, 'Delay for 9:15 vs 8:30 should burn to match target');

// Case B: User is at 8:45 (525s), Opponent is at 8:30 (510s). Target is 8:40 (520s). Difference = 5s -> 5000ms.
const delayB = testComputeMoveDelay(525, 510, true);
assert.strictEqual(delayB, 5000, 'Delay for 8:45 vs 8:30 should be 5000ms');

// Case C: User is at 8:35 (515s), Opponent is at 8:30 (510s). Target is 8:40 (520s). User is already within +10s -> baseDelay (1500ms).
const delayC = testComputeMoveDelay(515, 510, true);
assert.strictEqual(delayC, 1500, 'Delay for 8:35 vs 8:30 should be baseDelay');

// Case D: User is in time trouble (18s). Opponent has 200s. Should play rapid without burning clock.
const delayD = testComputeMoveDelay(18, 200, true);
assert.strictEqual(delayD, 800, 'Emergency time trouble should return rapid delay');

// Case E: Sync Clock is disabled. Should return baseDelay.
const delayE = testComputeMoveDelay(555, 510, false);
assert.strictEqual(delayE, 1500, 'Disabled sync should return baseDelay');

console.log('✓ Time Matching Math & Delay Unit Tests Passed.');
console.log('VERDICT: PASS');
