const Bet = require("../models/Bet");
const Match = require("../models/Match");
const Player = require("../models/Player");
const User = require("../models/User");
const { rtdb } = require("../config/firebase");

// Probabilidades VED baseado no histórico dos jogadores
function calculateOdds(match, playerStatsA, playerStatsB) {
  const drawA = (playerStatsA.draws + 1) / (playerStatsA.played + 3);
  const drawB = (playerStatsB.draws + 1) / (playerStatsB.played + 3);
  
  let pE = (drawA + drawB) / 2;
  pE = Math.max(0.05, Math.min(0.45, pE)); // Clamp entre 5% e 45%

  const wlA = (playerStatsA.wins + 1) / ((playerStatsA.wins + playerStatsA.losses) + 2);
  const wlB = (playerStatsB.wins + 1) / ((playerStatsB.wins + playerStatsB.losses) + 2);
  
  const rem = Math.max(0, 1 - pE);
  const sum = (wlA + wlB) || 1;
  
  let pA = rem * (wlA / sum);
  let pB = rem - pA;

  const A = Math.round(Math.max(0, Math.min(100, pA * 100)));
  const E = Math.round(Math.max(0, Math.min(100, pE * 100)));
  const D = Math.max(0, 100 - A - E);

  return { A, E, D };
}

// Retorna o ganho estimado para a aposta
function calculatePayout(odds, pick, stake = 2) {
  const probPct = pick === "A" ? odds.A : pick === "B" ? odds.D : odds.E;
  let pr = probPct / 100;
  if (pr <= 0) pr = 0.01;
  const dec = Math.max(1.5, Math.min(5.0, 0.9 * (1 / pr)));
  return {
    probPct,
    payout: Math.max(2, Math.round(stake * dec))
  };
}

// Obter estatísticas do jogador para cálculo das odds
async function getPlayerStats(playerId, allMatches) {
  const groupMatches = allMatches.filter(m => m.stage === "groups" && (m.aId === playerId || m.bId === playerId));
  let points = 0, wins = 0, draws = 0, losses = 0, played = 0;
  
  for (const m of groupMatches) {
    if (!m.result || m.result === "postponed") continue;
    played++;
    if (m.result === "draw") {
      draws++; points += 1;
    } else if (m.result === "A") {
      if (m.aId === playerId) { wins++; points += 3; } else { losses++; }
    } else if (m.result === "B") {
      if (m.bId === playerId) { wins++; points += 3; } else { losses++; }
    }
  }
  return { wins, draws, losses, played };
}

// Criar aposta
async function createBet(req, res) {
  const uid = req.user.uid;
  const { matchId, pick } = req.body;
  const stake = 2; // Custo fixo

  if (!matchId || !pick) {
    return res.status(400).json({ error: "Partida e palpite são obrigatórios." });
  }

  try {
    const match = await Match.getById(matchId);
    if (!match) return res.status(404).json({ error: "Partida não encontrada." });

    if (match.result) {
      return res.status(400).json({ error: "A partida já possui resultado ou foi adiada." });
    }

    const matchDate = match.date ? new Date(match.date) : null;
    if (matchDate && matchDate.getTime() <= Date.now()) {
      return res.status(400).json({ error: "Apostas encerradas para esta partida." });
    }

    // Calcular as odds
    const allMatches = await Match.getAll();
    const statsA = await getPlayerStats(match.aId, allMatches);
    const statsB = await getPlayerStats(match.bId, allMatches);
    const odds = calculateOdds(match, statsA, statsB);
    const { probPct, payout } = calculatePayout(odds, pick, stake);

    // Gravar no Firestore com transação
    const result = await Bet.create(uid, matchId, pick, payout, stake);

    // Puxar nomes para o feed
    const [playerA, playerB, userProfile] = await Promise.all([
      Player.getById(match.aId),
      Player.getById(match.bId),
      User.getProfile(uid)
    ]);

    const aName = playerA ? playerA.name : "?";
    const bName = playerB ? playerB.name : "?";
    const userName = userProfile ? (userProfile.displayName || userProfile.name) : req.user.name;

    // Registrar no RTDB (Bets Feed)
    if (rtdb) {
      const feedRef = rtdb.ref(`betsFeed/${result.id}`);
      await feedRef.set({
        uid,
        email: req.user.email || "",
        name: userName,
        userId: userProfile?.username || req.user.email.split("@")[0] || uid.slice(0, 6),
        matchId,
        aName,
        bName,
        stage: match.stage || "groups",
        group: match.group || null,
        pick,
        payout,
        stake,
        ts: Date.now()
      });
    }

    res.json({
      success: true,
      betId: result.id,
      refund: stake,
      message: "Aposta registrada com sucesso!"
    });
  } catch (error) {
    console.error("Erro ao apostar:", error.message);
    res.status(400).json({ error: error.message });
  }
}

// Desfazer aposta (dentro do limite de 5s do front-end)
async function undoBet(req, res) {
  const uid = req.user.uid;
  const { betId } = req.body;

  if (!betId) return res.status(400).json({ error: "ID da aposta é obrigatório." });

  try {
    const success = await Bet.undo(uid, betId);
    
    // Remover do feed RTDB
    if (success && rtdb) {
      await rtdb.ref(`betsFeed/${betId}`).remove();
    }

    res.json({ success, message: "Aposta desfeita com sucesso!" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

// Obter apostas do usuário logado
async function getMyBets(req, res) {
  try {
    const list = await Bet.getByUser(req.user.uid);
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: "Erro ao obter suas apostas." });
  }
}

// Obter rankings globais
async function getRankings(req, res) {
  try {
    const rankings = await User.getRankings();
    res.json(rankings);
  } catch (error) {
    res.status(500).json({ error: "Erro ao calcular rankings." });
  }
}

module.exports = {
  createBet,
  undoBet,
  getMyBets,
  getRankings
};
