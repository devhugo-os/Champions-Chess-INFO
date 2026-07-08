const Player = require("../models/Player");

// Obter todos os jogadores ativos
async function getAllPlayers(req, res) {
  try {
    const list = await Player.getAll();
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: "Erro ao obter jogadores." });
  }
}

// Obter jogador por ID
async function getPlayerById(req, res) {
  try {
    const player = await Player.getById(req.params.id);
    if (!player) return res.status(404).json({ error: "Jogador não encontrado." });
    res.json(player);
  } catch (error) {
    res.status(500).json({ error: "Erro ao obter jogador." });
  }
}

// Criar jogador manualmente (Admin)
async function createPlayer(req, res) {
  const { name, group } = req.body;
  if (!name) return res.status(400).json({ error: "Nome do jogador é obrigatório." });

  try {
    const player = await Player.create({ name, group: group || "A" });
    res.status(201).json(player);
  } catch (error) {
    res.status(500).json({ error: "Erro ao criar jogador." });
  }
}

// Atualizar jogador (Admin)
async function updatePlayer(req, res) {
  const { id } = req.params;
  const { name, group } = req.body;

  try {
    const player = await Player.getById(id);
    if (!player) return res.status(404).json({ error: "Jogador não encontrado." });

    const updated = await Player.update(id, { name: name || player.name, group: group || player.group });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Erro ao atualizar jogador." });
  }
}

// Excluir jogador (Admin)
async function deletePlayer(req, res) {
  try {
    await Player.delete(req.params.id);
    res.json({ success: true, message: "Jogador excluído do torneio." });
  } catch (error) {
    res.status(500).json({ error: "Erro ao excluir jogador." });
  }
}

// Obter lista de espera de participantes (Admin)
async function getWaitlist(req, res) {
  try {
    const list = await Player.getWaitlist();
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: "Erro ao obter lista de espera." });
  }
}

// Aprovar inscrição na fila (Admin)
async function approveWaitlist(req, res) {
  const { uid, group } = req.body;
  if (!uid) return res.status(400).json({ error: "UID do usuário é obrigatório." });

  try {
    const success = await Player.approveParticipant(uid, group || "A");
    if (success) {
      res.json({ success: true, message: "Participante aprovado e adicionado ao torneio!" });
    } else {
      res.status(400).json({ error: "Não foi possível aprovar a inscrição." });
    }
  } catch (error) {
    res.status(500).json({ error: "Erro ao aprovar inscrição." });
  }
}

// Rejeitar inscrição na fila (Admin)
async function rejectWaitlist(req, res) {
  const { uid } = req.body;
  if (!uid) return res.status(400).json({ error: "UID do usuário é obrigatório." });

  try {
    const success = await Player.rejectParticipant(uid);
    res.json({ success, message: "Inscrição rejeitada." });
  } catch (error) {
    res.status(500).json({ error: "Erro ao rejeitar inscrição." });
  }
}

module.exports = {
  getAllPlayers,
  getPlayerById,
  createPlayer,
  updatePlayer,
  deletePlayer,
  getWaitlist,
  approveWaitlist,
  rejectWaitlist
};
