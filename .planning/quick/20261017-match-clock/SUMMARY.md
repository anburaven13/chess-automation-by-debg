---
status: complete
date: 2026-10-17
slug: match-clock
description: Match bot clock with opponent clock in auto-play
---

# Quick Task Summary: Match Opponent Clock in Auto-Play

## Goal Achieved
Added automatic time-matching synchronization to the auto-play system so the bot dynamically matches the opponent's clock (ensuring your remaining time is no more than ~8-10 seconds ahead of the opponent), with safety guardrails against flagging.

## Changes Made
1. **[popup.html](file:///c:/Users/USER/Documents/antigravity/qwen-web-agent/popup.html)**:
   - Added toggle `Match Opponent Time (Max +10s)` in the auto-play section.
2. **[popup.js](file:///c:/Users/USER/Documents/antigravity/qwen-web-agent/popup.js)**:
   - Added persistent storage listener and syncing for `syncClock`.
3. **[content.js](file:///c:/Users/USER/Documents/antigravity/qwen-web-agent/content.js)**:
   - Added `parseClockSeconds()` supporting `mm:ss`, `hh:mm:ss`, and fractional seconds (`ss.s`).
   - Added `computeMoveDelay()` calculating the difference between your clock and the opponent's clock to burn down extra time until your clock is within +10s of opponent.
   - Added safety emergency threshold: if either player is under 25 seconds, switches to rapid moves (0.6s - 1.1s) to prevent flagging.
   - Added `showSyncBadge()` providing sleek on-screen status feedback when matching clocks.
4. **[scratch/test-clock-sync.js](file:///c:/Users/USER/Documents/antigravity/qwen-web-agent/scratch/test-clock-sync.js)**:
   - Executable unit tests confirming syntax, parsing, dynamic delay math, edge cases, and safety thresholds.

## Verification
- Executed `node test-clock-sync.js`
- Result: `VERDICT: PASS`
