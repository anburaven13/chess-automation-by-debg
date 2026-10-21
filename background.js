chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'get_best_move') {
    fetchBestMove(request.fen).then(sendResponse);
    return true; 
  }
});

async function fetchBestMove(fen) {
  try {
    // Count the number of pieces on the board
    const pieceCount = (fen.split(' ')[0].match(/[a-zA-Z]/g) || []).length;

    // If there are 7 or fewer pieces, use Endgame Tablebases for PERFECT play
    if (pieceCount <= 7) {
      const tbRes = await fetch(`https://tablebase.lichess.ovh/standard?fen=${encodeURIComponent(fen)}`);
      if (tbRes.ok) {
        const tbData = await tbRes.json();
        if (tbData.moves && tbData.moves.length > 0) {
          return { 
            move: tbData.moves[0].uci,
            mate: tbData.dtm !== undefined ? tbData.dtm : null,
            evaluation: tbData.category === "win" ? 99 : (tbData.category === "loss" ? -99 : 0)
          };
        }
      }
    }

    // We use a free, powerful Stockfish 16 API (Depth 15 is Grandmaster level)
    const res = await fetch(`https://stockfish.online/api/s/v2.php?fen=${encodeURIComponent(fen)}&depth=15`);
    if (!res.ok) throw new Error("Network error connecting to Stockfish API");
    
    const data = await res.json();
    if (data.success) {
       const parts = data.bestmove.split(' ');
       const move = parts[1];
       return { 
         move: move,
         evaluation: data.evaluation !== undefined ? data.evaluation : 0,
         mate: data.mate !== undefined ? data.mate : null
       };
    } else {
       throw new Error(data.data || "Stockfish API failed to evaluate position.");
    }
  } catch(e) {
    return { error: e.message };
  }
}
