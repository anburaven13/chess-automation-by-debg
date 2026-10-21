# Quick Task: Match Opponent Clock in Auto-Play

## Goal
Implement clock synchronization in the auto-play loop so that the bot's remaining time hovers close to the opponent's remaining time (e.g. no more than ~10 seconds ahead), while safeguarding against flagging in time trouble.

## Tasks
1. [x] **Reconnaissance & Design**:
   - Inspect clock DOM selectors on Chess.com (`.clock-top`, `.clock-bottom`).
   - Define clock regex & parsing for `mm:ss`, `hh:mm:ss`, and tenths of a second (`ss.s`).
   - Define delay formula: `target = opponentTime + 10s`. If `myTime > target`, wait `(myTime - target) * 1000ms` (capped to safe per-move limit).
   - Define safety guardrails: if time < 25s, drop delay to standard rapid response (0.8s - 1.2s).
2. [ ] **Popup UI & Settings**:
   - Add "Match Opponent Time" checkbox in `popup.html`.
   - Update `popup.js` to persist `syncClock` setting in `chrome.storage.local`.
3. [ ] **Content Script Logic**:
   - Add `parseClockSeconds(el)` in `content.js`.
   - Update auto-play loop in `content.js` to compute the dynamic wait time when `syncClock` is active.
   - Add dynamic visual countdown or indicator in console/DOM.
4. [ ] **Verification**:
   - Create a test script in `scratch/test-clock-sync.js` covering standard time formats, negative differences, low time conditions, and edge cases.
   - Run verification via Node.js to guarantee zero syntax or math errors.
