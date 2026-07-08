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

  // Detecção robusta de dispositivo móvel (incluindo rotação em landscape)
  const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
    || ('ontouchstart' in window) 
    || (window.matchMedia("(max-width: 900px)").matches);

  if (isMobileDevice) {
    document.body.classList.add("mobile-mode");
    document.body.classList.remove("desktop-mode");
  } else {
    document.body.classList.add("desktop-mode");
    document.body.classList.remove("mobile-mode");
  }

  // SVGs de ícones
  const iconHome = `<svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>`;
  const iconRegulamento = `<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`;
  const iconPartidas = `<svg viewBox="0 0 24 24"><polygon points="6 3 20 12 6 21 6 3"></polygon></svg>`;
  const iconTabela = `<svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
  const iconJogadores = `<svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`;
  const iconComunicados = `<svg viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>`;
  const iconVencedores = `<svg viewBox="0 0 24 24"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34"></path><path d="M12 2a5 5 0 0 0-5 5v3c0 2.21 1.79 4 4 4h2c2.21 0 4-1.79 4-4V7a5 5 0 0 0-5-5z"></path></svg>`;
  const iconChat = `<svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`;
  const iconApostas = `<svg viewBox="0 0 24 24"><rect x="2" y="6" width="20" height="12" rx="2"></rect><circle cx="12" cy="12" r="2"></circle><path d="M6 12h.01M18 12h.01"></path></svg>`;
  const iconPerfil = `<svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`;
  const iconAdmin = `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>`;

  // ==========================================
  // 1. NAVBAR DESKTOP
  // ==========================================
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

  // ==========================================
  // 2. NAVBAR MOBILE (HEADER E HAMBURGUER DRAWER)
  // ==========================================
  const mobileHeader = document.createElement("div");
  mobileHeader.className = "mobile-header";

  const userAvatarUrl = user?.avatarBase64 || "https://lh3.googleusercontent.com/a/default-user=s96-c";

  mobileHeader.innerHTML = `
    <div class="logo-area" onclick="window.location.href='index.html'">
      <img src="logo.png" alt="Logo"/>
      <strong>Champions Chess</strong>
    </div>
    <div class="right-side">
      ${user ? `<a href="perfil.html"><img src="${userAvatarUrl}" style="width:30px;height:30px;border-radius:50%;border:1.5px solid var(--accent-color);display:block;" alt="Avatar"/></a>` : ''}
      <button class="hamburger-btn" id="btn-hamburger">
        <svg viewBox="0 0 24 24"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
      </button>
    </div>
  `;

  // Backdrop e Drawer para Mobile
  const backdrop = document.createElement("div");
  backdrop.className = "drawer-backdrop";

  const drawer = document.createElement("div");
  drawer.className = "mobile-drawer";

  const drawerLinksHtml = `
    <a href="index.html" class="${filename === "index.html" || filename === "" ? "active" : ""}">
      ${iconHome} Início
    </a>
    <a href="regulamento.html" class="${filename === "regulamento.html" ? "active" : ""}">
      ${iconRegulamento} Regulamento
    </a>
    <a href="partidas.html" class="${filename === "partidas.html" ? "active" : ""}">
      ${iconPartidas} Partidas
    </a>
    <a href="tabela.html" class="${filename === "tabela.html" ? "active" : ""}">
      ${iconTabela} Tabela
    </a>
    <a href="players.html" class="${filename === "players.html" ? "active" : ""}">
      ${iconJogadores} Jogadores
    </a>
    <a href="comunicados.html" class="${filename === "comunicados.html" ? "active" : ""}">
      ${iconComunicados} Comunicados
    </a>
    <a href="vencedores.html" class="${filename === "vencedores.html" ? "active" : ""}">
      ${iconVencedores} Vencedores
    </a>
    <a href="chat.html" class="${filename === "chat.html" ? "active" : ""}">
      ${iconChat} Chat
    </a>
    <a href="apostas.html" class="${filename === "apostas.html" ? "active" : ""}">
      ${iconApostas} Apostas
    </a>
    <a href="perfil.html" class="${filename === "perfil.html" ? "active" : ""}">
      ${iconPerfil} Perfil
    </a>
    ${isAdmin ? `
      <a href="admin.html" class="${filename === "admin.html" ? "active" : ""}" style="color: #ffd8a8;">
        ${iconAdmin} Admin Panel
      </a>
    ` : ""}
  `;

  drawer.innerHTML = `
    <div class="drawer-links">
      ${drawerLinksHtml}
    </div>
    <div class="drawer-footer">
      ${user ? `<button id="btn-mobile-logout" class="btn btn-ghost" style="width:100%; justify-content:center;">Sair da Conta</button>` : ''}
      <span style="font-size:11px; text-align:center; color:var(--text-muted);">Champions Chess INFO v1.5</span>
    </div>
  `;

  // Inserir no DOM
  document.body.prepend(desktopNav);
  document.body.appendChild(mobileHeader);
  document.body.appendChild(backdrop);
  document.body.appendChild(drawer);

  // Listeners do Hamburguer Menu
  const toggleDrawer = () => {
    drawer.classList.toggle("open");
    backdrop.classList.toggle("open");
  };

  mobileHeader.querySelector("#btn-hamburger").addEventListener("click", toggleDrawer);
  backdrop.addEventListener("click", toggleDrawer);

  // Logout Listeners
  const logout = () => {
    window.auth.signOut().then(() => {
      localStorage.removeItem("user");
      window.location.href = "login.html";
    }).catch(err => console.error("Erro ao deslogar:", err));
  };

  const desktopLogoutBtn = document.getElementById("btn-desktop-logout");
  if (desktopLogoutBtn) desktopLogoutBtn.addEventListener("click", logout);

  const mobileLogoutBtn = document.getElementById("btn-mobile-logout");
  if (mobileLogoutBtn) mobileLogoutBtn.addEventListener("click", logout);
}
