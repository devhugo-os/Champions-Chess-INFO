document.addEventListener("DOMContentLoaded", () => {
  renderNavigation();
});

function renderNavigation() {
  const currentPath = window.location.pathname;
  
  // Tentar obter usuário do localStorage
  let user = null;
  try {
    const userStr = localStorage.getItem("user");
    if (userStr) user = JSON.parse(userStr);
  } catch (e) {}

  // Se por acaso cair aqui sem usuário no localStorage mas tiver o cookie, 
  // faremos o fetch do perfil para salvar no localStorage
  const token = document.cookie.split("; ").find(r => r.startsWith("session_token="))?.split("=")[1];
  
  if (!user && token) {
    fetch("/api/auth/profile", {
      headers: { "Authorization": `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      if (data.profile) {
        const u = {
          uid: data.profile.id,
          name: data.profile.displayName || data.profile.name,
          role: data.profile.role,
          participantStatus: data.profile.participantStatus,
          avatarBase64: data.profile.avatarBase64
        };
        localStorage.setItem("user", JSON.stringify(u));
        window.location.reload();
      }
    }).catch(e => console.warn("Erro ao recuperar perfil em navegação:", e));
  }

  const isAdmin = user && (user.role === "admin" || user.isAdmin === true);

  // 1. Criar Navbar Desktop
  const desktopNav = document.createElement("nav");
  desktopNav.className = "desktop-navbar";
  
  let desktopNavLinks = `
    <a href="/" class="${currentPath === "/" ? "active" : ""}">Início</a>
    <a href="/regulamento" class="${currentPath === "/regulamento" ? "active" : ""}">Regulamento</a>
    <a href="/partidas" class="${currentPath === "/partidas" ? "active" : ""}">Partidas</a>
    <a href="/tabela" class="${currentPath === "/tabela" ? "active" : ""}">Tabela</a>
    <a href="/jogadores" class="${currentPath === "/jogadores" ? "active" : ""}">Jogadores</a>
    <a href="/comunicados" class="${currentPath === "/comunicados" ? "active" : ""}">Comunicados</a>
    <a href="/vencedores" class="${currentPath === "/vencedores" ? "active" : ""}">Vencedores</a>
    <a href="/chat" class="${currentPath === "/chat" ? "active" : ""}">Chat</a>
    <a href="/apostas" class="${currentPath === "/apostas" ? "active" : ""}">Apostas</a>
    <a href="/perfil" class="${currentPath === "/perfil" ? "active" : ""}">Perfil</a>
  `;

  if (isAdmin) {
    desktopNavLinks += `<a href="/admin" class="${currentPath === "/admin" ? "active" : ""}" style="color: #ffd8a8; border-color: rgba(255, 216, 168, 0.2);">Painel Admin</a>`;
  }

  let authAreaHtml = "";
  if (user) {
    const avatar = user.avatarBase64 || "https://lh3.googleusercontent.com/a/default-user=s96-c";
    authAreaHtml = `
      <div class="auth-area">
        <a href="/perfil" style="display:flex;align-items:center;gap:10px;text-decoration:none;color:inherit;">
          <img src="${avatar}" style="width:34px;height:34px;border-radius:50%;border:2px solid var(--accent-color);" alt="Avatar"/>
          <span style="font-size:13.5px;font-weight:600;color:var(--text-primary);">${user.name}</span>
        </a>
        <button id="btn-desktop-logout" class="btn btn-ghost" style="padding:6px 14px;font-size:12px;border-radius:9999px;">Sair</button>
      </div>
    `;
  }

  desktopNav.innerHTML = `
    <div class="logo-area" style="cursor:pointer;" onclick="window.location.href='/'">
      <img src="/logo.png" alt="Logo"/>
      <strong>Champions Chess INFO</strong>
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
    <a href="/" class="${currentPath === "/" ? "active" : ""}">
      ${homeIcon}
      <span>Início</span>
    </a>
    <a href="/partidas" class="${currentPath === "/partidas" ? "active" : ""}">
      ${matchesIcon}
      <span>Partidas</span>
    </a>
    <a href="/tabela" class="${currentPath === "/tabela" ? "active" : ""}">
      ${tableIcon}
      <span>Tabela</span>
    </a>
    <a href="/apostas" class="${currentPath === "/apostas" ? "active" : ""}">
      ${betsIcon}
      <span>Apostas</span>
    </a>
    <a href="/chat" class="${currentPath === "/chat" ? "active" : ""}">
      ${chatIcon}
      <span>Chat</span>
    </a>
  `;

  if (isAdmin) {
    mobileNavLinks += `
      <a href="/admin" class="${currentPath === "/admin" ? "active" : ""}">
        ${adminIcon}
        <span>Admin</span>
      </a>
    `;
  } else {
    mobileNavLinks += `
      <a href="/perfil" class="${currentPath === "/perfil" ? "active" : ""}">
        ${profileIcon}
        <span>Perfil</span>
      </a>
    `;
  }

  mobileNav.innerHTML = mobileNavLinks;

  // Inserir no DOM
  document.body.prepend(desktopNav);
  document.body.appendChild(mobileNav);

  // Lógica de Logout
  const desktopLogoutBtn = document.getElementById("btn-desktop-logout");
  if (desktopLogoutBtn) {
    desktopLogoutBtn.addEventListener("click", () => {
      localStorage.removeItem("user");
      document.cookie = "session_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      window.location.href = "/login";
    });
  }
}
