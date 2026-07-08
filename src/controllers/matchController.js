const Match = require("../models/Match");
const Bet = require("../models/Bet");

// Obter todas as partidas
async function getAllMatches(req, res) {
  try {
    const list = await Match.getAll();
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: "Erro ao obter partidas." });
  }
}

// Obter uma partida específica
async function getMatchById(req, res) {
  try {
    const match = await Match.getById(req.params.id);
    if (!match) return res.status(404).json({ error: "Partida não encontrada." });
    res.json(match);
  } catch (error) {
    res.status(500).json({ error: "Erro ao obter partida." });
  }
}

// Criar partida (Admin)
async function createMatch(req, res) {
  const { aId, bId, stage, group, code, date } = req.body;
  if (!aId || !bId || !stage) {
    return res.status(400).json({ error: "Jogador A, Jogador B e Etapa são obrigatórios." });
  }

  try {
    const payload = {
      aId,
      bId,
      stage,
      group: group || null,
      code: code || null,
      date: date || null,
      result: null,
      aReady: false,
      bReady: false,
      status: "scheduled" // scheduled, live, finished
    };
    const match = await Match.create(payload);
    res.status(201).json(match);
  } catch (error) {
    res.status(500).json({ error: "Erro ao criar partida." });
  }
}

// Atualizar partida / Definir resultado (Admin)
async function updateMatch(req, res) {
  const { id } = req.params;
  const { aId, bId, stage, group, code, date, result, status } = req.body;

  try {
    const match = await Match.getById(id);
    if (!match) return res.status(404).json({ error: "Partida não encontrada." });

    const payload = {};
    if (aId !== undefined) payload.aId = aId;
    if (bId !== undefined) payload.bId = bId;
    if (stage !== undefined) payload.stage = stage;
    if (group !== undefined) payload.group = group || null;
    if (code !== undefined) payload.code = code || null;
    if (date !== undefined) payload.date = date || null;
    
    // Atualização de resultado
    let resultChanged = false;
    if (result !== undefined && result !== match.result) {
      payload.result = result || null;
      resultChanged = true;
      
      // Se definiu resultado, define o status como finalizado
      if (result && result !== "postponed") {
        payload.status = "finished";
      } else if (result === "postponed") {
        payload.status = "scheduled";
      } else {
        payload.status = status || "scheduled";
      }
    }

    if (status !== undefined) {
      payload.status = status;
    }

    const updated = await Match.update(id, payload);

    // Se o resultado foi alterado, reconcilia as apostas de forma síncrona/segura
    if (resultChanged) {
      await Bet.reconcileMatchBets(id, payload.result);
    }

    // Auto-criação de semifinais se for aplicável e todos os jogos de grupo acabaram
    if (resultChanged && stage === "groups") {
      await Match.autoCreateSemisIfGroupsDone();
    }

    res.json(updated);
  } catch (error) {
    console.error("Erro ao atualizar partida:", error.message);
    res.status(500).json({ error: "Erro ao atualizar partida." });
  }
}

// Excluir partida (Admin)
async function deleteMatch(req, res) {
  try {
    await Match.delete(req.params.id);
    res.json({ success: true, message: "Partida excluída com sucesso." });
  } catch (error) {
    res.status(500).json({ error: "Erro ao excluir partida." });
  }
}

// Sinalizar prontidão de participante (Matchmaking)
async function setPlayerReady(req, res) {
  const { id } = req.params; // ID da partida
  const uid = req.user.uid;  // UID do usuário logado

  try {
    const match = await Match.getById(id);
    if (!match) return res.status(404).json({ error: "Partida não encontrada." });

    if (match.status === "finished") {
      return res.status(400).json({ error: "Partida já foi finalizada." });
    }

    const payload = {};
    let isPlayer = false;

    // Verificar se o usuário logado é o Jogador A ou B
    if (match.aId === uid) {
      payload.aReady = true;
      isPlayer = true;
    } else if (match.bId === uid) {
      payload.bReady = true;
      isPlayer = true;
    }

    if (!isPlayer) {
      return res.status(403).json({ error: "Você não é participante desta partida." });
    }

    // Se ambos ficarem prontos, inicia a partida automaticamente
    const currentAReady = payload.aReady !== undefined ? payload.aReady : !!match.aReady;
    const currentBReady = payload.bReady !== undefined ? payload.bReady : !!match.bReady;

    if (currentAReady && currentBReady) {
      payload.status = "live";
    }

    const updated = await Match.update(id, payload);
    
    // Notifica via Socket.io (será feito na inicialização do servidor)
    if (req.io) {
      req.io.emit("match_update", { id, ...updated });
    }

    res.json({ success: true, match: updated });
  } catch (error) {
    console.error("Erro no matchmaking:", error.message);
    res.status(500).json({ error: "Erro ao atualizar estado de pronto." });
  }
}

module.exports = {
  getAllMatches,
  getMatchById,
  createMatch,
  updateMatch,
  deleteMatch,
  setPlayerReady
};
