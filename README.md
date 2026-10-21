# ♟️ Chess Automation by debg

A lightweight, powerful Google Chrome Extension (Manifest V3) that extracts live chess board states directly from the DOM, calculates optimal moves via a dual-engine pipeline, and executes them with simulated mouse interactions.

---

## 🚀 Key Features

* **Real-Time DOM FEN Extraction:**
  * Uses coordinate geometry (`getBoundingClientRect`) to mathematically map pieces to squares from the browser screen.
  * Robust edge detection that accurately catches pieces on outer files (`a` and `h` files).
  * Automatically handles flipped boards when playing as Black.
  * Calculates dynamic castling rights (`KQkq`) based on current King and Rook positions.

* **Dual-Engine Architecture:**
  * **Mid-Game (> 7 pieces remaining):** Powered by Stockfish 16 at Depth 15 for deep tactical calculation.
  * **Endgame (≤ 7 pieces remaining):** Automatically switches to the **Lichess Syzygy 7-Piece Tablebase API**, executing mathematically solved checkmate lines with zero 50-move rule draws.

* **Opponent Clock Synchronization (Human-Pacing):**
  * Reads the opponent and player clocks directly from the page DOM (`.clock-top` and `.clock-bottom`).
  * Dynamically calculates move delays so remaining time stays within natural proximity (e.g., within ~8–10s) of the opponent's clock.
  * **Emergency Low-Time Guardrail:** Bypasses delays and moves immediately if your time falls under 25 seconds to prevent flagging.

* **Modern Liquid Glass UI:**
  * Clean frosted glassmorphism popup with animated fluid background gradients and high-contrast controls.
  * Single-toggle hands-free Auto-Play mode.

---

## 🛠️ Project Structure

```text
├── manifest.json       # Chrome Extension Manifest (V3)
├── popup.html          # Extension popup interface (Liquid Glass design)
├── popup.js            # UI event bindings & chrome.storage state sync
├── background.js       # Service worker handling Stockfish & Syzygy API calls
├── content.js          # Injected script: DOM parsing, FEN generator & click automation
└── scratch/            # Local test suites and validation scripts
```

---

## 📥 Installation

1. Clone or download this repository:
   ```bash
   git clone https://github.com/anburaven13/chess-automation-by-debg.git
   ```
2. Open Google Chrome and navigate to `chrome://extensions/`.
3. Toggle on **Developer mode** in the top-right corner.
4. Click **Load unpacked** and select this project directory.
5. Pin the extension to your Chrome toolbar.

---

## 🎮 How to Use

1. Navigate to a game on [Chess.com](https://www.chess.com).
2. Click the extension icon in your toolbar.
3. Select your side: **Play as White** or **Play as Black**.
4. Choose your mode:
   * **Manual Mode:** Click **"Manual: Calculate & Play"** to analyze and play one move at a time.
   * **Auto-Play Mode:** Check **"ENABLE AUTO-PLAY"** and optionally **"Match Opponent Time"**.
5. Close the popup and let the extension play autonomously!

---

## ⚖️ Disclaimer

This project was built for educational, game-analysis, and web-automation research purposes. Using automated tools in competitive rated online games violates platform fair-play policies and terms of service. Use responsibly in unrated analysis or bot matches.

---

## 👤 Author

Developed by **Debangshu Ghosh** ([@anburaven13](https://github.com/anburaven13))
