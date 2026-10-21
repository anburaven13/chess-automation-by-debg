chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'get_fen') {
    try {
      const fen = extractFEN(request.turn);
      sendResponse({ fen: fen });
    } catch(e) {
      sendResponse({ error: e.message });
    }
    return true;
  }
  
  if (request.type === 'chess_move') {
    handleChessMove(request.from, request.to)
      .then(() => sendResponse({ success: true }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }
});

function extractFEN(turn) {
  const boards = Array.from(document.querySelectorAll('chess-board, wc-chess-board, .board, #board-single'));
  if (boards.length === 0) throw new Error("No chess board found. Make sure you are on chess.com and a game has started.");
  const board = boards.reduce((max, b) => (b.getBoundingClientRect().width > max.getBoundingClientRect().width) ? b : max, boards[0]);
  
  const pieces = board.querySelectorAll('.piece');
  if (pieces.length === 0) throw new Error("No chess pieces found.");

  const isFlipped = board.classList.contains('flipped');
  const boardRect = board.getBoundingClientRect();
  const sqW = boardRect.width / 8;
  const sqH = boardRect.height / 8;

  const boardArr = Array(8).fill(null).map(() => Array(8).fill(null));
  
  pieces.forEach(p => {
    let pieceType = '';
    p.classList.forEach(c => {
      if (c.length === 2 && (c[0] === 'w' || c[0] === 'b')) pieceType = c;
    });
    if (!pieceType) return;
    
    const pRect = p.getBoundingClientRect();
    const pX = pRect.left + pRect.width / 2;
    const pY = pRect.top + pRect.height / 2;

    let visualX = Math.floor((pX - boardRect.left) / sqW);
    let visualY = Math.floor((pY - boardRect.top) / sqH);
    
    visualX = Math.max(0, Math.min(7, visualX));
    visualY = Math.max(0, Math.min(7, visualY));
    
    let fenRow, fenCol;
    if (isFlipped) {
       fenRow = 7 - visualY;
       fenCol = 7 - visualX;
    } else {
       fenRow = visualY;
       fenCol = visualX;
    }
    
    const charMap = {
      'wp': 'P', 'wn': 'N', 'wb': 'B', 'wr': 'R', 'wq': 'Q', 'wk': 'K',
      'bp': 'p', 'bn': 'n', 'bb': 'b', 'br': 'r', 'bq': 'q', 'bk': 'k'
    };
    
    boardArr[fenRow][fenCol] = charMap[pieceType];
  });

  let fen = '';
  for (let r = 0; r < 8; r++) {
    let empty = 0;
    for (let f = 0; f < 8; f++) {
      if (boardArr[r][f] === null) {
        empty++;
      } else {
        if (empty > 0) {
          fen += empty;
          empty = 0;
        }
        fen += boardArr[r][f];
      }
    }
    if (empty > 0) fen += empty;
    if (r < 7) fen += '/';
  }
  
  if (fen === '8/8/8/8/8/8/8/8') {
    throw new Error("Could not detect piece positions. Please ensure the board is visible on screen.");
  }
  
  let castling = '';
  if (boardArr[7][4] === 'K') {
    if (boardArr[7][7] === 'R') castling += 'K';
    if (boardArr[7][0] === 'R') castling += 'Q';
  }
  if (boardArr[0][4] === 'k') {
    if (boardArr[0][7] === 'r') castling += 'k';
    if (boardArr[0][0] === 'r') castling += 'q';
  }
  if (castling === '') castling = '-';
  
  return fen + ` ${turn} ${castling} - 0 1`;
}

async function handleChessMove(from, to) {
    from = from.toLowerCase();
    to = to.toLowerCase();
    
    const boards = Array.from(document.querySelectorAll('chess-board, wc-chess-board, .board, #board-single'));
    if (boards.length === 0) throw new Error("Could not find a chess board on the page.");
    const board = boards.reduce((max, b) => (b.getBoundingClientRect().width > max.getBoundingClientRect().width) ? b : max, boards[0]);
    
    const isFlipped = board.classList.contains('flipped');
    const rect = board.getBoundingClientRect();
    const squareWidth = rect.width / 8;
    const squareHeight = rect.height / 8;
    
    function getSquareCoords(sq) {
       const file = sq.charCodeAt(0) - 97;
       const rank = parseInt(sq[1]) - 1;
       
       let xIndex = isFlipped ? 7 - file : file;
       let yIndex = isFlipped ? rank : 7 - rank; 
       
       return {
         x: rect.left + (xIndex * squareWidth) + (squareWidth / 2),
         y: rect.top + (yIndex * squareHeight) + (squareHeight / 2)
       };
    }
    
    const fromCoords = getSquareCoords(from);
    const toCoords = getSquareCoords(to);
    
    function simulateClick(x, y) {
      const indicator = document.createElement('div');
      indicator.style.position = 'fixed';
      indicator.style.left = `${x - 10}px`;
      indicator.style.top = `${y - 10}px`;
      indicator.style.width = '20px';
      indicator.style.height = '20px';
      indicator.style.backgroundColor = 'rgba(0, 255, 0, 0.7)';
      indicator.style.border = '2px solid black';
      indicator.style.borderRadius = '50%';
      indicator.style.zIndex = '2147483647';
      indicator.style.pointerEvents = 'none';
      document.body.appendChild(indicator);
      setTimeout(() => indicator.remove(), 1000);

      const element = document.elementFromPoint(x, y);
      if (element) {
        const eventOpts = { bubbles: true, cancelable: true, view: window, clientX: x, clientY: y };
        element.dispatchEvent(new MouseEvent('pointerdown', eventOpts));
        element.dispatchEvent(new MouseEvent('mousedown', eventOpts));
        element.dispatchEvent(new MouseEvent('pointerup', eventOpts));
        element.dispatchEvent(new MouseEvent('mouseup', eventOpts));
        element.dispatchEvent(new MouseEvent('click', eventOpts));
      }
    }
    
    simulateClick(fromCoords.x, fromCoords.y);
    
    return new Promise(resolve => {
       setTimeout(() => {
         simulateClick(toCoords.x, toCoords.y);
         resolve();
       }, 150);
    });
}

// ==== AUTO-PLAY & CLOCK SYNC LOGIC ====
let isAutoPlay = false;
let botColor = 'w';
let syncClock = true;
let isThinking = false;
let lastFen = '';

// Sync settings with popup
chrome.storage.local.get(['autoPlay', 'botColor', 'syncClock'], (res) => {
  if (res.autoPlay !== undefined) isAutoPlay = res.autoPlay;
  if (res.botColor !== undefined) botColor = res.botColor;
  if (res.syncClock !== undefined) syncClock = res.syncClock;
});
chrome.storage.onChanged.addListener((changes) => {
  if (changes.autoPlay) isAutoPlay = changes.autoPlay.newValue;
  if (changes.botColor) botColor = changes.botColor.newValue;
  if (changes.syncClock) syncClock = changes.syncClock.newValue;
});

// Robust Clock Parser (supports mm:ss, hh:mm:ss, and ss.s)
function parseClockSeconds(clockElement) {
  if (!clockElement) return null;
  const timeEl = clockElement.querySelector('.clock-time') || clockElement;
  const text = (timeEl.innerText || timeEl.textContent || '').trim();
  const match = text.match(/(\d+):(\d+)(?::(\d+))?(?:\.(\d+))?/);
  if (!match) return null;
  
  if (match[3] !== undefined) {
    // hh:mm:ss
    const h = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    const s = parseInt(match[3], 10);
    const ms = match[4] ? parseFloat("0." + match[4]) : 0;
    return h * 3600 + m * 60 + s + ms;
  } else {
    // mm:ss
    const m = parseInt(match[1], 10);
    const s = parseInt(match[2], 10);
    const ms = match[4] ? parseFloat("0." + match[4]) : 0;
    return m * 60 + s + ms;
  }
}

// Compute dynamic delay to match opponent's time
function computeMoveDelay(myClockEl, oppClockEl) {
  // Base natural human reaction delay (between 1.0s and 2.0s with slight jitter)
  const baseDelay = 1000 + Math.floor(Math.random() * 1000);

  if (!syncClock) return baseDelay;

  const mySec = parseClockSeconds(myClockEl);
  const oppSec = parseClockSeconds(oppClockEl);

  if (mySec === null || oppSec === null) {
    return baseDelay;
  }

  // Low-time emergency guardrail: under 25 seconds remaining, play rapidly to prevent flagging
  if (mySec < 25 || oppSec < 20) {
    return 600 + Math.floor(Math.random() * 500); // 0.6s - 1.1s
  }

  // Target: Keep our clock no more than (opponent time + ~9-10s)
  const bufferSeconds = 8.5 + (Math.random() * 1.5);
  const targetMySeconds = oppSec + bufferSeconds;

  if (mySec > targetMySeconds) {
    // We are ahead of target; burn clock to match opponent
    const secondsToBurn = mySec - targetMySeconds;
    // Cap single move delay to max 30s so the game keeps moving progressively
    const delayMs = Math.min(secondsToBurn * 1000, 30000);
    return Math.max(delayMs, baseDelay);
  }

  // If already at or below target time, play with natural delay
  return baseDelay;
}

// Optional sleek on-screen status badge
function showSyncBadge(text, durationMs) {
  let badge = document.getElementById('debg-sync-badge');
  if (!badge) {
    badge = document.createElement('div');
    badge.id = 'debg-sync-badge';
    badge.style.position = 'fixed';
    badge.style.bottom = '20px';
    badge.style.right = '20px';
    badge.style.background = 'rgba(26, 42, 108, 0.85)';
    badge.style.backdropFilter = 'blur(8px)';
    badge.style.color = '#ffffff';
    badge.style.padding = '8px 14px';
    badge.style.borderRadius = '8px';
    badge.style.border = '1px solid rgba(255, 255, 255, 0.2)';
    badge.style.fontFamily = 'sans-serif';
    badge.style.fontSize = '12px';
    badge.style.fontWeight = 'bold';
    badge.style.zIndex = '2147483647';
    badge.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)';
    badge.style.pointerEvents = 'none';
    badge.style.transition = 'opacity 0.3s ease';
    document.body.appendChild(badge);
  }
  badge.textContent = text;
  badge.style.opacity = '1';

  clearTimeout(badge.fadeTimeout);
  badge.fadeTimeout = setTimeout(() => {
    if (badge) badge.style.opacity = '0';
  }, durationMs);
}

// Check every 1.5 seconds if it's our turn
setInterval(() => {
  if (!isAutoPlay || isThinking) return;

  // Chess.com highlights the local player's clock when it's their turn
  const bottomClock = document.querySelector('.clock-bottom, .player-bottom .clock-component');
  const topClock = document.querySelector('.clock-top, .player-top .clock-component');
  if (!bottomClock) return; // Not in a game

  const isMyTurn = bottomClock.classList.contains('clock-player-turn') || 
                   bottomClock.classList.contains('active') ||
                   bottomClock.classList.contains('clock-active');
                   
  if (isMyTurn) {
    try {
      const currentFen = extractFEN(botColor);
      
      // Don't calculate the exact same position twice (e.g., if click failed)
      if (currentFen === lastFen) return;
      
      isThinking = true;
      const delayMs = computeMoveDelay(bottomClock, topClock);

      if (delayMs > 2500) {
        showSyncBadge(`🕒 Matching opponent clock... (${(delayMs / 1000).toFixed(0)}s)`, delayMs);
      }
      
      setTimeout(() => {
        chrome.runtime.sendMessage({ action: 'get_best_move', fen: currentFen }, (engineResponse) => {
          if (engineResponse && engineResponse.move) {
            const move = engineResponse.move;
            handleChessMove(move.substring(0, 2), move.substring(2, 4)).then(() => {
              lastFen = currentFen; // Remember this position so we don't spam clicks
              setTimeout(() => { isThinking = false; }, 1000);
            }).catch(() => {
              isThinking = false;
            });
          } else {
            isThinking = false;
          }
        });
      }, delayMs);
      
    } catch(e) {
       // If fen extraction fails (e.g. game over screen), do nothing.
       isThinking = false;
    }
  }
}, 1500);
