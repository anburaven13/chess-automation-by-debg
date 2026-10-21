const playBtn = document.getElementById('playBtn');
const statusDiv = document.getElementById('status');
const autoPlayToggle = document.getElementById('autoPlayToggle');
const syncClockToggle = document.getElementById('syncClockToggle');
const turnRadios = document.querySelectorAll('input[name="turn"]');

// Load settings
chrome.storage.local.get(['autoPlay', 'botColor', 'syncClock'], (res) => {
  if (res.autoPlay) autoPlayToggle.checked = true;
  if (res.syncClock !== undefined) syncClockToggle.checked = res.syncClock;
  if (res.botColor === 'b') {
    document.querySelector('input[value="b"]').checked = true;
  }
});

// Save settings
autoPlayToggle.addEventListener('change', (e) => {
  chrome.storage.local.set({ autoPlay: e.target.checked });
  if (e.target.checked) statusDiv.textContent = "Auto-play enabled. Close this popup and let it run!";
});
syncClockToggle.addEventListener('change', (e) => {
  chrome.storage.local.set({ syncClock: e.target.checked });
});
turnRadios.forEach(r => {
  r.addEventListener('change', (e) => {
    chrome.storage.local.set({ botColor: e.target.value });
  });
});

playBtn.addEventListener('click', async () => {
  const turn = document.querySelector('input[name="turn"]:checked').value;
  playBtn.disabled = true;
  statusDiv.textContent = "Analyzing board...";
  
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    if (!tabs[0]) {
      statusDiv.textContent = "Error: No active tab.";
      playBtn.disabled = false;
      return;
    }
    
    // 1. Ask content script to read the board and get FEN
    chrome.tabs.sendMessage(tabs[0].id, { action: 'get_fen', turn: turn }, (response) => {
      if (!response || response.error) {
        statusDiv.textContent = "Error: " + (response?.error || "Could not read board or page not refreshed.");
        playBtn.disabled = false;
        return;
      }
      
      statusDiv.textContent = "Asking Engine...";
      
      // 2. Ask background script to get best move from API
      chrome.runtime.sendMessage({ action: 'get_best_move', fen: response.fen }, (engineResponse) => {
        if (!engineResponse || engineResponse.error) {
          statusDiv.textContent = "Error: " + (engineResponse?.error || "Engine failed.");
          playBtn.disabled = false;
          return;
        }
        
        const move = engineResponse.move;
        statusDiv.textContent = "Playing move: " + move;
        
        // 3. Ask content script to execute the clicks
        chrome.tabs.sendMessage(tabs[0].id, { 
          type: 'chess_move', 
          from: move.substring(0, 2), 
          to: move.substring(2, 4) 
        }, (clickResponse) => {
          if (!clickResponse || !clickResponse.success) {
             statusDiv.textContent = "Failed to click on the board.";
          } else {
             statusDiv.textContent = "Move played: " + move;
          }
          playBtn.disabled = false;
        });
      });
    });
  });
});
