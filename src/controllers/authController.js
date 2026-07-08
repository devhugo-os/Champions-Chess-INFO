const User = require("../models/User");

// Login do usuário e inicialização de carteira/perfil
async function login(req, res) {
  const { uid, email, name, picture } = req.user;

  try {
    // Inicializa a carteira do usuário (dá os 6 CCIP iniciais se for novo)
    await User.ensureWallet(uid, email);

    // Tenta conceder o bônus semanal (se já passou 1 semana do último bônus)
    await User.grantWeeklyBonus(uid);

    // Carrega ou inicializa o perfil
    let profile = await User.getProfile(uid);
    if (!profile) {
      profile = await User.createOrUpdateProfile(uid, {
        name: name || email.split("@")[0],
        displayName: name || email.split("@")[0],
        email: email,
        role: "spectator", // Padrão inicial
        participantStatus: "none", // none, pending, approved, rejected
        avatarBase64: picture || ""
      });
    }

    res.json({
      success: true,
      user: {
        uid,
        email,
        name: profile.displayName || name,
        role: profile.role,
        participantStatus: profile.participantStatus,
        avatarBase64: profile.avatarBase64
      }
    });
  } catch (error) {
    console.error("Erro no login:", error.message);
    res.status(500).json({ error: "Erro interno no servidor ao realizar login." });
  }
}

// Obter dados do perfil do usuário logado
async function getProfile(req, res) {
  const uid = req.user.uid;
  try {
    const profile = await User.getProfile(uid);
    const wallet = await User.getWallet(uid);
    
    if (!profile) {
      return res.status(404).json({ error: "Perfil não encontrado." });
    }

    res.json({
      profile,
      wallet: wallet ? wallet.points : 0
    });
  } catch (error) {
    res.status(500).json({ error: "Erro ao obter perfil." });
  }
}

// Atualizar nome de exibição e/ou escolha de papel
async function updateProfile(req, res) {
  const uid = req.user.uid;
  const { displayName, roleSelection } = req.body;

  try {
    const profile = await User.getProfile(uid);
    if (!profile) {
      return res.status(404).json({ error: "Perfil não encontrado." });
    }

    const updates = {};
    if (displayName !== undefined) {
      updates.displayName = displayName.trim();
    }

    // Se o usuário selecionou que quer ser Participante
    if (roleSelection === "participant") {
      // Apenas atualiza para "pending" se ele ainda não for participante aprovado ou pendente
      if (profile.role !== "participant" && profile.participantStatus !== "pending") {
        updates.roleSelection = "participant";
        updates.participantStatus = "pending"; // Entra na fila de aprovação
      }
    } else if (roleSelection === "spectator") {
      // Se quiser voltar a ser espectador (caso estivesse na fila)
      if (profile.role !== "participant") {
        updates.roleSelection = "spectator";
        updates.participantStatus = "none";
        updates.role = "spectator";
      }
    }

    const updatedProfile = await User.createOrUpdateProfile(uid, updates);
    res.json({ success: true, profile: updatedProfile });
  } catch (error) {
    console.error("Erro ao atualizar perfil:", error.message);
    res.status(500).json({ error: "Erro interno ao atualizar perfil." });
  }
}

// Salvar imagem de perfil em Base64
async function uploadAvatar(req, res) {
  const uid = req.user.uid;
  const { avatarBase64 } = req.body;

  if (!avatarBase64 || !avatarBase64.startsWith("data:image/")) {
    return res.status(400).json({ error: "Imagem inválida. Envie uma string Base64 válida." });
  }

  try {
    await User.createOrUpdateProfile(uid, { avatarBase64 });
    res.json({ success: true, message: "Foto de perfil atualizada!" });
  } catch (error) {
    res.status(500).json({ error: "Erro ao salvar foto de perfil." });
  }
}

module.exports = {
  login,
  getProfile,
  updateProfile,
  uploadAvatar
};
