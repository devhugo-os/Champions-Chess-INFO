document.addEventListener("DOMContentLoaded", () => {
  renderNavigation();
});

function renderNavigation() {
  const currentPath = window.location.pathname;
  const filename = currentPath.substring(currentPath.lastIndexOf('/') + 1);

  // Tentar obter usuário do localStorage
  let user = null;
  try {
    const userStr = localStorage.getItem("user");
    if (userStr) user = JSON.parse(userStr);
  } catch (e) {}

  const isAdmin = user && (user.role === "admin" || user.isAdmin === true);

  // 1. Criar Navbar Desktop
  const desktopNav = document.createElement("nav");
  desktopNav.className = "desktop-navbar";
  
  let desktopNavLinks = `
    <a href="index.html" class="${filename === "index.html" || filename === "" ? "active" : ""}">Início</a>
    <a href="regulamento.html" class="${filename === "regulamento.html" ? "active" : ""}">Regulamento</a>
    <a href="partidas.html" class="${filename === "partidas.html" ? "active" : ""}">Partidas</a>
    <a href="tabela.html" class="${filename === "tabela.html" ? "active" : ""}">Tabela</a>
    <a href="players.html" class="${filename === "players.html" ? "active" : ""}">Jogadores</a>
    <a href="comunicados.html" class="${filename === "comunicados.html" ? "active" : ""}">Comunicados</a>
    <a href="vencedores.html" class="${filename === "vencedores.html" ? "active" : ""}">Vencedores</a>
    <a href="chat.html" class="${filename === "chat.html" ? "active" : ""}">Chat</a>
    <a href="apostas.html" class="${filename === "apostas.html" ? "active" : ""}">Apostas</a>
    <a href="perfil.html" class="${filename === "perfil.html" ? "active" : ""}">Perfil</a>
  `;

  if (isAdmin) {
    desktopNavLinks += `<a href="admin.html" class="${filename === "admin.html" ? "active" : ""}" style="color: #ffd8a8; border-color: rgba(255, 216, 168, 0.2);">Painel Admin</a>`;
  }

  let authAreaHtml = "";
  if (user) {
    const avatar = user.avatarBase64 || "https://lh3.googleusercontent.com/a/default-user=s96-c";
    authAreaHtml = `
      <div class="auth-area" style="flex-shrink:0;">
        <a href="perfil.html" style="display:flex;align-items:center;gap:10px;text-decoration:none;color:inherit;max-width:150px;overflow:hidden;">
          <img src="${avatar}" style="width:34px;height:34px;border-radius:50%;border:2px solid var(--accent-color);flex-shrink:0;" alt="Avatar"/>
          <span style="font-size:13px;font-weight:600;color:var(--text-primary);white-space:nowrap;text-overflow:ellipsis;overflow:hidden;max-width:90px;">${user.name}</span>
        </a>
        <button id="btn-desktop-logout" class="btn btn-ghost" style="padding:6px 12px;font-size:11.5px;border-radius:9999px;flex-shrink:0;">Sair</button>
      </div>
    `;
  }

  desktopNav.innerHTML = `
    <div class="logo-area" style="cursor:pointer;flex-shrink:0;" onclick="window.location.href='index.html'">
      <img src="logo.png" style="flex-shrink:0;" alt="Logo"/>
      <strong style="white-space:nowrap;">Champions Chess INFO</strong>
    </div>
    <div class="nav-links">
      ${desktopNavLinks}
    </div>
    ${authAreaHtml}
  `;

  // 2. Criar Navbar Mobile (Bottom Navigation)
  const mobileNav = document.createElement("nav");
  mobileNav.className = "mobile-navbar";

  // Ícones SVG
  const homeIcon = `<svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>`;
  const matchesIcon = `<svg viewBox="0 0 24 24"><polygon points="6 3 20 12 6 21 6 3"></polygon></svg>`;
  const tableIcon = `<svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
  const betsIcon = `<svg viewBox="0 0 24 24"><rect x="2" y="6" width="20" height="12" rx="2"></rect><circle cx="12" cy="12" r="2"></circle><path d="M6 12h.01M18 12h.01"></path></svg>`;
  const chatIcon = `<svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`;
  const profileIcon = `<svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`;
  const adminIcon = `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>`;

  let mobileNavLinks = `
    <a href="index.html" class="${filename === "index.html" || filename === "" ? "active" : ""}">
      ${homeIcon}
      <span>Início</span>
    </a>
    <a href="partidas.html" class="${filename === "partidas.html" ? "active" : ""}">
      ${matchesIcon}
      <span>Partidas</span>
    </a>
    <a href="tabela.html" class="${filename === "tabela.html" ? "active" : ""}">
      ${tableIcon}
      <span>Tabela</span>
    </a>
    <a href="apostas.html" class="${filename === "apostas.html" ? "active" : ""}">
      ${betsIcon}
      <span>Apostas</span>
    </a>
    <a href="chat.html" class="${filename === "chat.html" ? "active" : ""}">
      ${chatIcon}
      <span>Chat</span>
    </a>
  `;

  if (isAdmin) {
    mobileNavLinks += `
      <a href="admin.html" class="${filename === "admin.html" ? "active" : ""}">
        ${adminIcon}
        <span>Admin</span>
      </a>
    `;
  } else {
    mobileNavLinks += `
      <a href="perfil.html" class="${filename === "perfil.html" ? "active" : ""}">
        ${profileIcon}
        <span>Perfil</span>
      </a>
    `;
  }

  mobileNav.innerHTML = mobileNavLinks;

  // Inserir no DOM
  document.body.prepend(desktopNav);
  document.body.appendChild(mobileNav);

  // Lógica de Logout com Firebase
  const desktopLogoutBtn = document.getElementById("btn-desktop-logout");
  if (desktopLogoutBtn) {
    desktopLogoutBtn.addEventListener("click", () => {
      window.auth.signOut().then(() => {
        localStorage.removeItem("user");
        window.location.href = "login.html";
      }).catch(err => {
        console.error("Erro ao deslogar:", err);
      });
    });
  }
}
