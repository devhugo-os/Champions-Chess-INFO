const Chat = require("../models/Chat");
const { requireAdmin } = require("../middleware/auth");
const { rtdb } = require("../config/firebase");

// Enviar mensagem no chat
async function sendMessage(req, res) {
  const { uid, email, name } = req.user;
  const { text } = req.body;

  if (!text || text.trim() === "") {
    return res.status(400).json({ error: "O texto da mensagem é obrigatório." });
  }

  const sanitizedText = text.trim().slice(0, 500); // Limita tamanho

  try {
    const msg = await Chat.addMessage(uid, name, email, sanitizedText);
    res.status(201).json({ success: true, message: msg });
  } catch (error) {
    res.status(500).json({ error: "Erro ao enviar mensagem no chat." });
  }
}

// Apagar mensagem no chat
async function deleteMessage(req, res) {
  const { id } = req.params;
  const { uid, isAdmin } = req.user;

  try {
    if (!rtdb) return res.status(500).json({ error: "Banco de dados em tempo real indisponível." });

    const msgSnap = await rtdb.ref(`chat/${id}`).once("value");
    if (!msgSnap.exists()) {
      return res.status(404).json({ error: "Mensagem não encontrada." });
    }

    const msg = msgSnap.val();
    // Apenas admin ou o próprio autor podem apagar
    if (msg.uid !== uid && !isAdmin) {
      return res.status(403).json({ error: "Não autorizado a apagar esta mensagem." });
    }

    await Chat.deleteMessage(id);
    res.json({ success: true, message: "Mensagem apagada com sucesso." });
  } catch (error) {
    res.status(500).json({ error: "Erro ao apagar mensagem." });
  }
}

// Limpeza manual completa do chat (Admin)
async function clearAllChat(req, res) {
  try {
    if (!rtdb) return res.status(500).json({ error: "Banco de dados em tempo real indisponível." });
    await rtdb.ref("chat").remove();
    res.json({ success: true, message: "Todas as mensagens do chat foram removidas." });
  } catch (error) {
    res.status(500).json({ error: "Erro ao limpar o chat." });
  }
}

module.exports = {
  sendMessage,
  deleteMessage,
  clearAllChat
};
