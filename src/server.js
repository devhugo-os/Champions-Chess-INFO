const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const { rtdb, initialized } = require("./config/firebase");
const apiRouter = require("./routes/api");
const Chat = require("./models/Chat");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;
const SESSION_SECRET = process.env.SESSION_SECRET || "champions_chess_info_secret_key_123";

// Middlewares globais
app.use(cors());
app.use(express.json({ limit: "5mb" })); // Aumentado limite para aceitar imagens em base64
app.use(express.urlencoded({ extended: true, limit: "5mb" }));
app.use(cookieParser(SESSION_SECRET));

// Middleware de segurança do front-end (Captcha + Login Obrigatório)
function securityGuard(req, res, next) {
  const isStaticFile = req.path.includes(".") && !req.path.endsWith(".html");
  const isApiRoute = req.path.startsWith("/api");
  const isCaptchaPage = req.path === "/captcha" || req.path === "/captcha.html";
  const isLoginPage = req.path === "/login" || req.path === "/login.html";

  // Arquivos estáticos e rotas de API não entram nos redirecionamentos de página
  if (isStaticFile || isApiRoute) {
    return next();
  }

  // 1. Verificar Captcha
  const captchaSolved = req.cookies?.captcha_solved === "true";
  if (!captchaSolved && !isCaptchaPage) {
    return res.redirect("/captcha");
  }

  // 2. Verificar Login
  const loggedIn = !!req.cookies?.session_token;
  if (!loggedIn && !isLoginPage && !isCaptchaPage) {
    return res.redirect("/login");
  }

  // 3. Se logado e tentar acessar o login, vai para a Home
  if (loggedIn && isLoginPage) {
    return res.redirect("/");
  }

  next();
}

// Aplicar barreira de segurança global
app.use(securityGuard);

// Servir arquivos estáticos da pasta public (exceto HTMLs principais, para fazer roteamento limpo)
app.use(express.static(path.join(__dirname, "../public"), {
  extensions: ["html"] // permite servir arquivos sem .html na URL
}));

// Roteador da API
// Anexamos a instância do Socket.io no request para que os controllers possam utilizá-lo se necessário
app.use((req, res, next) => {
  req.io = io;
  next();
});
app.use("/api", apiRouter);

// Roteamento Limpo para o Front-end (Views Individuais em rotas específicas)
const publicDir = path.join(__dirname, "../public");
app.get("/", (req, res) => res.sendFile(path.join(publicDir, "index.html")));
app.get("/regulamento", (req, res) => res.sendFile(path.join(publicDir, "regulamento.html")));
app.get("/partidas", (req, res) => res.sendFile(path.join(publicDir, "partidas.html")));
app.get("/tabela", (req, res) => res.sendFile(path.join(publicDir, "tabela.html")));
app.get("/jogadores", (req, res) => res.sendFile(path.join(publicDir, "players.html")));
app.get("/comunicados", (req, res) => res.sendFile(path.join(publicDir, "comunicados.html")));
app.get("/apostas", (req, res) => res.sendFile(path.join(publicDir, "apostas.html")));
app.get("/chat", (req, res) => res.sendFile(path.join(publicDir, "chat.html")));
app.get("/perfil", (req, res) => res.sendFile(path.join(publicDir, "perfil.html")));
app.get("/vencedores", (req, res) => res.sendFile(path.join(publicDir, "vencedores.html")));
app.get("/admin", (req, res) => res.sendFile(path.join(publicDir, "admin.html")));
app.get("/captcha", (req, res) => res.sendFile(path.join(publicDir, "captcha.html")));
app.get("/login", (req, res) => res.sendFile(path.join(publicDir, "login.html")));

// Rota coringa para 404
app.use((req, res) => {
  res.status(404).sendFile(path.join(publicDir, "index.html")); // Redireciona para início se rota não existir
});

// ==================================================================
// CONFIGURAÇÃO DOS WEBSOCKETS (SOCKET.IO) E INTEGRAÇÃO DO FIREBASE RTDB
// ==================================================================
io.on("connection", (socket) => {
  console.log(`Cliente conectado via Socket.io: ${socket.id}`);
  
  socket.on("disconnect", () => {
    console.log(`Cliente desconectado: ${socket.id}`);
  });
});

// Registrar ouvintes no Firebase RTDB para espelhar dados em tempo real no Socket.io
if (initialized && rtdb) {
  console.log("Registrando listeners de tempo real no Firebase RTDB...");
  
  // Ouvir mensagens de chat
  const chatRef = rtdb.ref("chat");
  chatRef.on("child_added", (snap) => {
    io.emit("chat_message_added", { id: snap.key, ...snap.val() });
  });
  chatRef.on("child_removed", (snap) => {
    io.emit("chat_message_removed", snap.key);
  });

  // Ouvir feed de apostas
  const feedRef = rtdb.ref("betsFeed");
  feedRef.on("child_added", (snap) => {
    io.emit("bet_feed_added", { id: snap.key, ...snap.val() });
  });
  feedRef.on("child_removed", (snap) => {
    io.emit("bet_feed_removed", snap.key);
  });
} else {
  console.warn("Firebase RTDB inativo ou rodando em modo Mock. Ouvintes de tempo real não registrados.");
}

// ==================================================================
// BACKGROUND JOBS (Limpeza Automática do Chat a cada 5 horas)
// ==================================================================
// Executa o auto-clean de mensagens velhas imediatamente na inicialização
if (initialized) {
  setTimeout(() => {
    console.log("[Auto-Clean] Iniciando limpeza inicial do chat...");
    Chat.autoClean();
  }, 5000);
}

// Agenda a limpeza a cada 5 horas
const FIVE_HOURS_MS = 5 * 60 * 60 * 1000;
setInterval(() => {
  console.log("[Auto-Clean] Executando limpeza agendada de 5 horas do chat...");
  Chat.autoClean();
}, FIVE_HOURS_MS);

// Inicializar Servidor HTTP
server.listen(PORT, () => {
  console.log("==================================================================");
  console.log(`Servidor Champions Chess INFO rodando na porta ${PORT}`);
  console.log(`Acesse localmente em: http://localhost:${PORT}`);
  console.log("==================================================================");
});
