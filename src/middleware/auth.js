const { auth, db, initialized } = require("../config/firebase");

// Middleware para verificar se o usuário está logado
async function requireAuth(req, res, next) {
  // Se o Firebase não estiver inicializado, rodamos em modo de desenvolvimento (Mock)
  if (!initialized) {
    req.user = {
      uid: "mock_user_123",
      email: "mock_user@championsinfo.com",
      name: "Mock User",
      picture: "https://lh3.googleusercontent.com/a/default-user=s96-c"
    };
    return next();
  }

  let token = req.cookies?.session_token || req.headers.authorization;
  
  if (token && token.startsWith("Bearer ")) {
    token = token.slice(7);
  }

  if (!token) {
    return res.status(401).json({ error: "Não autorizado. Token de sessão ausente." });
  }

  try {
    const decodedToken = await auth.verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error("Erro de validação do token:", error.message);
    res.status(401).json({ error: "Sessão expirada ou token inválido." });
  }
}

// Middleware para verificar se o usuário é Administrador
async function requireAdmin(req, res, next) {
  await requireAuth(req, res, async () => {
    // Se o Firebase não estiver inicializado, o mock_user_123 é tratado como Admin
    if (!initialized) {
      req.user.isAdmin = true;
      return next();
    }

    try {
      const uid = req.user.uid;
      const adminSnap = await db.collection("admins").doc(uid).get();
      const isAdmin = adminSnap.exists && (!!adminSnap.data().active || !!adminSnap.data().isAdmin);

      if (!isAdmin) {
        return res.status(403).json({ error: "Acesso negado. Apenas administradores podem executar esta ação." });
      }
      
      req.user.isAdmin = true;
      next();
    } catch (error) {
      console.error("Erro ao verificar privilégios de Admin:", error.message);
      res.status(500).json({ error: "Erro interno ao processar privilégios." });
    }
  });
}

module.exports = {
  requireAuth,
  requireAdmin
};
