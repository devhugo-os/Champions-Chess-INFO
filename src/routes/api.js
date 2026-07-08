const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");
const playerController = require("../controllers/playerController");
const matchController = require("../controllers/matchController");
const betController = require("../controllers/betController");
const chatController = require("../controllers/chatController");

const { requireAuth, requireAdmin } = require("../middleware/auth");

// ==========================================
// CAPTCHA ENDPOINTS
// ==========================================
// Gerar pergunta do captcha
router.get("/captcha/question", (req, res) => {
  const num1 = Math.floor(Math.random() * 10) + 1;
  const num2 = Math.floor(Math.random() * 10) + 1;
  const operations = ["+", "-", "*"];
  const op = operations[Math.floor(Math.random() * operations.length)];
  
  let answer = 0;
  if (op === "+") answer = num1 + num2;
  else if (op === "-") answer = num1 - num2;
  else if (op === "*") answer = num1 * num2;

  // Armazena a resposta em um cookie assinado temporário
  res.cookie("captcha_ans", String(answer), {
    httpOnly: true,
    signed: true,
    maxAge: 3 * 60 * 1000 // Válido por 3 minutos
  });

  res.json({
    question: `Quanto é ${num1} ${op} ${num2}?`
  });
});

// Verificar resposta do captcha
router.post("/captcha/verify", (req, res) => {
  const { answer } = req.body;
  const correctAnswer = req.signedCookies?.captcha_ans;

  if (!correctAnswer) {
    return res.status(400).json({ error: "Captcha expirado ou não solicitado. Recarregue a pergunta." });
  }

  if (String(answer).trim() === correctAnswer) {
    // Definir cookie indicando que o captcha foi resolvido (válido por 12 horas)
    res.cookie("captcha_solved", "true", {
      httpOnly: true,
      maxAge: 12 * 60 * 60 * 1000 // 12 horas
    });
    
    // Limpar o cookie da resposta
    res.clearCookie("captcha_ans");
    res.json({ success: true, message: "Acesso liberado!" });
  } else {
    res.status(400).json({ error: "Resposta incorreta. Tente novamente." });
  }
});


// ==========================================
// AUTH & PERFIL ENDPOINTS (Requer autenticação)
// ==========================================
router.post("/auth/login", requireAuth, authController.login);
router.get("/auth/profile", requireAuth, authController.getProfile);
router.put("/auth/profile", requireAuth, authController.updateProfile);
router.post("/auth/profile/avatar", requireAuth, authController.uploadAvatar);


// ==========================================
// JOGADORES (PLAYERS) ENDPOINTS
// ==========================================
router.get("/players", playerController.getAllPlayers);
router.get("/players/:id", playerController.getPlayerById);
router.post("/players", requireAdmin, playerController.createPlayer);
router.put("/players/:id", requireAdmin, playerController.updatePlayer);
router.delete("/players/:id", requireAdmin, playerController.deletePlayer);

// Lista de espera (Inscrições)
router.get("/players/waitlist/list", requireAdmin, playerController.getWaitlist);
router.post("/players/waitlist/approve", requireAdmin, playerController.approveWaitlist);
router.post("/players/waitlist/reject", requireAdmin, playerController.rejectWaitlist);


// ==========================================
// PARTIDAS (MATCHES) ENDPOINTS
// ==========================================
router.get("/matches", matchController.getAllMatches);
router.get("/matches/:id", matchController.getMatchById);
router.post("/matches", requireAdmin, matchController.createMatch);
router.put("/matches/:id", requireAdmin, matchController.updateMatch);
router.delete("/matches/:id", requireAdmin, matchController.deleteMatch);

// Matchmaking (Sinalizar prontidão)
router.post("/matches/:id/ready", requireAuth, matchController.setPlayerReady);


// ==========================================
// APOSTAS (BETS) & RANKINGS ENDPOINTS
// ==========================================
router.get("/bets/my", requireAuth, betController.getMyBets);
router.post("/bets", requireAuth, betController.createBet);
router.post("/bets/undo", requireAuth, betController.undoBet);
router.get("/rankings", betController.getRankings);


// ==========================================
// CHAT ENDPOINTS
// ==========================================
router.post("/chat", requireAuth, chatController.sendMessage);
router.delete("/chat/:id", requireAuth, chatController.deleteMessage);
router.delete("/chat", requireAdmin, chatController.clearAllChat);

// ==========================================
// COMUNICADOS (POSTS) ENDPOINTS
// ==========================================
router.get("/posts", async (req, res) => {
  const { db } = require("../config/firebase");
  if (!db) return res.json([]);
  try {
    const snap = await db.collection("posts").orderBy("createdAt", "desc").get();
    const list = [];
    snap.forEach(d => {
      const data = d.data();
      list.push({
        id: d.id,
        ...data,
        createdAt: data.createdAt ? (data.createdAt.toMillis ? data.createdAt.toMillis() : (data.createdAt._seconds * 1000 || data.createdAt)) : Date.now()
      });
    });
    res.json(list);
  } catch (error) {
    console.error("Erro ao obter posts:", error.message);
    res.status(500).json({ error: "Erro ao carregar comunicados." });
  }
});

router.post("/posts", requireAdmin, async (req, res) => {
  const { db, admin } = require("../config/firebase");
  const { title, body } = req.body;
  if (!title || !body) return res.status(400).json({ error: "Título e corpo são obrigatórios." });
  if (!db) return res.status(500).json({ error: "Firebase inativo" });

  try {
    const docRef = await db.collection("posts").add({
      title,
      body,
      authorUid: req.user.uid,
      authorEmail: req.user.email || "",
      authorName: req.user.name || req.user.email.split("@")[0] || "Admin",
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    res.status(201).json({ id: docRef.id, title, body });
  } catch (error) {
    res.status(500).json({ error: "Erro ao criar comunicado." });
  }
});

router.delete("/posts/:id", requireAdmin, async (req, res) => {
  const { db } = require("../config/firebase");
  if (!db) return res.status(500).json({ error: "Firebase inativo" });
  try {
    await db.collection("posts").doc(req.params.id).delete();
    res.json({ success: true, message: "Comunicado excluído." });
  } catch (error) {
    res.status(500).json({ error: "Erro ao excluir comunicado." });
  }
});

module.exports = router;
