document.addEventListener("DOMContentLoaded", () => {
  renderNavigation();
});

function renderNavigation() {
  const currentPath = window.location.pathname;
  const filename = currentPath.substring(currentPath.lastIndexOf('/') + 1);

  // Tentar obter usuário do localStorage
  // Evitar duplicações limpando elementos existentes
  document.querySelector(".desktop-navbar")?.remove();
  document.querySelector(".mobile-header")?.remove();
  document.querySelector(".drawer-backdrop")?.remove();
  document.querySelector(".mobile-drawer")?.remove();

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
      <div class="logo-wrapper"><img src="logo.png" style="flex-shrink:0;" alt="Logo"/></div>
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
      <div class="logo-wrapper"><img src="logo.png" alt="Logo"/></div>
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
      <span style="font-size:11px; text-align:center; color:var(--text-muted);">Champions Chess INFO v1.6.9</span>
    </div>
  `;

  // Inserir no DOM
  document.body.prepend(desktopNav);
  document.body.appendChild(mobileHeader);
  document.body.appendChild(backdrop);
  document.body.appendChild(drawer);

  // Injetar estilos customizados para Alert e Confirm na tela
  if (!document.getElementById("custom-modal-styles")) {
    const style = document.createElement("style");
    style.id = "custom-modal-styles";
    style.innerHTML = `
      .custom-modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(6, 9, 19, 0.85);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        z-index: 999999;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
      }
      .custom-modal-card {
        max-width: 420px;
        width: 100%;
        border: 1px solid var(--border-color);
        padding: 24px;
        border-radius: var(--radius-md);
        background: #0d1117;
        text-align: center;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
        animation: modalFadeIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
      }
      @keyframes modalFadeIn {
        from { opacity: 0; transform: scale(0.8); }
        to { opacity: 1; transform: scale(1); }
      }
      .custom-toast {
        position: fixed;
        bottom: 24px;
        right: 24px;
        background: #161b22;
        border: 1px solid var(--border-color);
        border-left: 4px solid var(--accent-color);
        color: var(--text-primary);
        padding: 14px 20px;
        border-radius: 6px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.5);
        z-index: 1000000;
        font-size: 13.5px;
        display: flex;
        align-items: center;
        gap: 10px;
        animation: toastSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
      }
      @keyframes toastSlideIn {
        from { transform: translateY(120px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      @media (max-width: 480px) {
        .custom-toast {
          left: 16px;
          right: 16px;
          bottom: 16px;
        }
      }
    `;
    document.head.appendChild(style);
  }

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

  // Injetar Changelog e Versão no rodapé dinamicamente em todas as páginas
  const footer = document.querySelector(".site-footer");
  if (footer) {
    footer.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:6px; align-items:center; justify-content:center;">
        <span>© Champions Chess INFO</span>
        <button onclick="showChangelogModal()" class="btn btn-ghost" style="padding: 4px 8px; font-size: 11px; border-radius: 4px; color: var(--text-muted); text-decoration: underline; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;">
          📋 Versão v1.6.9 (Histórico de Alterações)
        </button>
      </div>
    `;
  }
}

window.showChangelogModal = function() {
  let modal = document.getElementById("changelog-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "changelog-modal";
    modal.style.cssText = "position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(6, 9, 19, 0.95); backdrop-filter: blur(12px); z-index: 10005; display: flex; align-items: center; justify-content: center; padding: 20px;";
    modal.innerHTML = `
      <div class="card" style="max-width: 520px; width: 100%; border: 1px solid var(--border-color); padding: 30px; position: relative; max-height: 85vh; display: flex; flex-direction: column;">
        <button onclick="document.getElementById('changelog-modal').remove()" style="position: absolute; top: 16px; right: 16px; background: none; border: none; color: var(--text-muted); font-size: 24px; cursor: pointer;">&times;</button>
        <h2 style="margin-bottom: 20px; font-weight: 800; text-align: center; background: linear-gradient(135deg, #fff, var(--accent-color)); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Histórico de Alterações</h2>
        
        <div style="overflow-y: auto; flex-grow: 1; text-align: left; padding-right: 8px; font-size: 13px; line-height: 1.6; color: var(--text-secondary);">
          <h4 style="color: var(--accent-color); margin-bottom: 4px;">Versão v1.6.9 (Atual)</h4>
          <ul style="margin-bottom: 16px; padding-left: 20px;">
            <li>Sincronização de Sessão (currentUser): Corrigido o carregamento assíncrono do perfil do usuário logado na aba de partidas para evitar erros ao votar no matchmaking.</li>
            <li>Automação de Versão do RTDB: Implementada verificação que sincroniza a versão local do site no Realtime Database do Firebase assim que o Administrador acessa o painel admin.html.</li>
            <li>Ocultação de Inscrições para Admins: Escondida a aba de solicitação de inscrição e participação no torneio no perfil de usuários administradores.</li>
          </ul>

          <h4 style="color: var(--secondary-color); margin-bottom: 4px;">Versão v1.6.7</h4>
          <ul style="margin-bottom: 16px; padding-left: 20px;">
            <li>Contagem Regressiva de Atualização: Adicionado temporizador forçado de 5 segundos para recarregar automaticamente o site em nova versão.</li>
            <li>Redirecionamento Automático: Jogadores que marcam prontidão são direcionados de forma automática para a tela do jogo quando o status vira "AO VIVO".</li>
            <li>Status de Tolerância do Hoster (5 min): Jogador A (Brancas) é o hoster. Caso ele saia do jogo, o oponente visualiza um banner com cronômetro de 5 minutos para retorno antes de aplicar W.O.</li>
            <li>Validação de Jogador Duplicado: O painel de controle impede que o mesmo enxadrista seja escalado simultaneamente como Jogador A e Jogador B.</li>
            <li>Correção de Transição de Fases: Corrigido o bug onde reverter semifinal para fase de grupos não carregava o grupo A por padrão.</li>
            <li>Exibição de Status Pendente: A lista do admin agora exibe "⏳ A Decidir" para tipo de partidas não predefinidos.</li>
          </ul>

          <h4 style="color: var(--secondary-color); margin-bottom: 4px;">Versão v1.6.6</h4>
          <ul style="margin-bottom: 16px; padding-left: 20px;">
            <li>Controle de Presença e W.O. (5 min): Jogadores têm 5 minutos para entrar na página do tabuleiro. Vitória automática por W.O. se o oponente não comparecer, ou adiamento se ambos faltarem.</li>
            <li>Relógio de Xadrez Rápido (10 min): Cada jogador tem 10 minutos para toda a partida. Perda automática por tempo se o relógio zerar.</li>
            <li>Sincronização Direta de Resultados: Partidas online finalizadas no tabuleiro atualizam automaticamente seu status no Firestore e pontuações do campeonato.</li>
            <li>Melhorias no Admin & Grupo Automático: Habilitada a seleção automática do grupo ao escalar jogadores do mesmo grupo. O código de rodada foi ocultado do formulário para evitar poluição visual.</li>
            <li>Exibição Limpa de Comunicados: Removidos asteriscos brutos (**) do corpo dos comunicados, substituindo-os por formatação em negrito automatizada.</li>
            <li>Ampliação do Tabuleiro Mobile: Aumentado o tamanho máximo do tabuleiro para 345px no celular para melhor precisão dos lances.</li>
          </ul>

          <h4 style="color: var(--secondary-color); margin-bottom: 4px;">Versão v1.6.4</h4>
          <ul style="margin-bottom: 16px; padding-left: 20px;">
            <li>Centralização do Tabuleiro: Redesenhado o dimensionamento responsivo do tabuleiro para evitar transbordamento lateral e centralizá-lo perfeitamente no mobile.</li>
            <li>Correção Histórica das Jogadas: Solucionada a falha onde o histórico de lances era substituído a cada nova jogada. O log agora exibe a lista completa de movimentos sem perdas.</li>
            <li>Animação de Vitória Premium: Adicionada comemoração dinâmica com chuva de confetes e painel de celebração (troféu/empate) ao encerrar as partidas.</li>
            <li>Sorteio de Formato Matchmaking: Se os jogadores selecionarem preferências divergentes (Online vs Presencial), o sistema realiza um sorteio determinístico e justo via transação atômica.</li>
          </ul>

          <h4 style="color: var(--secondary-color); margin-bottom: 4px;">Versão v1.6.3</h4>
          <ul style="margin-bottom: 16px; padding-left: 20px;">
            <li>Prevenção de Rolagem no Mobile: Desabilitado o scroll da página ao deslizar peças no tabuleiro.</li>
            <li>Click-to-Move e Destaque Visual: Possibilidade de jogar clicando na peça e no quadrado de destino, exibindo dicas visuais de caminhos válidos (círculos e anéis de captura).</li>
            <li>Histórico e Replay Completo: Controles de navegação para avançar/retroceder lance a lance em partidas concluídas.</li>
            <li>Revisão de Partida e Heurística de Precisão: Algoritmo que avalia as jogadas e calcula a precisão (Brilhantes, Geniais, Excelentes, Erros, Blunders).</li>
            <li>Filtro por Grupo no Admin: A lista de jogadores nos seletores do admin se adapta automaticamente ao grupo selecionado, prevenindo escalações de grupos diferentes.</li>
            <li>Edição Direta de Vídeos em Partidas: Botão rápido para administradores cadastrarem links de gravações diretamente nos cards da aba de partidas.</li>
          </ul>

          <h4 style="color: var(--secondary-color); margin-bottom: 4px;">Versão v1.6.2</h4>
          <ul style="margin-bottom: 16px; padding-left: 20px;">
            <li>Avatares de Enxadristas nas Partidas: Adicionada a exibição das fotos de perfil de cada participante no card do torneio.</li>
            <li>Link de Gravação / Replay da Partida: Suporte para assistir à partida finalizada. O administrador pode salvar um link externo (YouTube/Lichess) no painel, e se não houver, enxadristas podem clicar em "Replay no Tabuleiro" para ver o tabuleiro virtual do site.</li>
            <li>Correção de Escopos no Painel: Solucionado o travamento da página de administração fechando adequadamente os blocos de funções.</li>
            <li>Estabilidade do Debugger: Corrigido o loop recursivo no script de segurança que gerava estouro de pilha (stack overflow) e congelava as conexões.</li>
            <li>Identificação Limpa de Códigos: Exibição limpa do código da rodada integrado no cabeçalho do card sem quebras de layout.</li>
          </ul>

          <h4 style="color: var(--secondary-color); margin-bottom: 4px;">Versão v1.6.1</h4>
          <ul style="margin-bottom: 16px; padding-left: 20px;">
            <li>Controle de Tipo Descentralizado: Escolha de tipo de confronto (Online/Presencial) decidida pelos próprios enxadristas no matchmaking.</li>
            <li>Correção de Painel de Admin: Solucionada a falha de carregamento infinito do painel ativando listeners apenas após a resolução do Firebase Auth.</li>
            <li>Melhoria Visual nas Partidas: Centralização e estilização dos badges do tipo de partida com efeito translúcido iluminado.</li>
            <li>Ajuste de Logo: Redução do diâmetro do logo da navbar para evitar que ela fique desproporcional.</li>
            <li>Animações Ampliadas: Aumento da escala da animação de entrada de modais e do slide-in de notificações Toast.</li>
          </ul>

          <h4 style="color: var(--secondary-color); margin-bottom: 4px;">Versão v1.6.0</h4>
          <ul style="margin-bottom: 16px; padding-left: 20px;">
            <li>Sincronização de xadrez híbrida via P2P (WebRTC DataChannel) com fallback via RTDB (WebSockets).</li>
            <li>Responsividade mobile profunda nos tabuleiros, grades de estatísticas e tabelas.</li>
            <li>Substituição de alertas e diálogos do navegador por toasts e modais de confirmação customizados.</li>
            <li>Geração automática de comunicados de vitórias, empates e adiamentos na linha do tempo.</li>
            <li>Distribuição aleatória automática de grupos ao aprovar membro na fila do torneio.</li>
            <li>Validação estrutural para impedir partidas da fase de grupos entre grupos diferentes.</li>
          </ul>

          <h4 style="color: var(--secondary-color); margin-bottom: 4px;">Versão v1.5.0</h4>
          <ul style="margin-bottom: 16px; padding-left: 20px;">
            <li>Ampliação de escala dos logos e avatares (Desktop 60px, Mobile 50px) para maior visibilidade.</li>
            <li>Cadastro obrigatório de nickname no primeiro acesso (onboarding) e limite de 3 alterações.</li>
            <li>Correção de salvamento tardio da imagem de perfil apenas ao clicar em Salvar Alterações.</li>
            <li>Prevenção de race condition na seleção de papéis com desativação/cancelamento seguro da waitlist.</li>
            <li>Sistema de verificação de atualização forçada com base na versão remota do Realtime Database.</li>
          </ul>
          
          <h4 style="color: var(--text-muted); margin-bottom: 4px;">Versão v1.4.0</h4>
          <ul style="margin-bottom: 16px; padding-left: 20px;">
            <li>Substituição da barra móvel inferior por Cabeçalho de 54px + Menu lateral (Drawer) Hamburguer.</li>
            <li>Detecção aprimorada de dispositivos móveis em modo paisagem (Landscape).</li>
            <li>Correções de alinhamento na tabela de classificação de apostadores.</li>
            <li>Ocultação de painéis extras no preview do Regulamento PDF.</li>
          </ul>
        </div>
        
        <button onclick="document.getElementById('changelog-modal').remove()" class="btn btn-ghost" style="margin-top: 20px; width: 100%;">Fechar</button>
      </div>
    `;
    document.body.appendChild(modal);
  }
};

// Sobrescrever window.alert global para exibir toast flutuante
window.alert = function(message) {
  const toast = document.createElement("div");
  toast.className = "custom-toast";
  const isError = message.toLowerCase().includes("erro") || 
                  message.toLowerCase().includes("negado") || 
                  message.toLowerCase().includes("falha") || 
                  message.toLowerCase().includes("recusado") || 
                  message.toLowerCase().includes("atenção");
                  
  if (isError) {
    toast.style.borderLeftColor = "var(--danger-color)";
    toast.innerHTML = `❌ <span style="font-weight: 600;">${message}</span>`;
  } else {
    toast.innerHTML = `✅ <span style="font-weight: 600;">${message}</span>`;
  }
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.transition = "all 0.5s ease";
    toast.style.opacity = "0";
    toast.style.transform = "translateY(10px)";
    setTimeout(() => toast.remove(), 500);
  }, 3500);
};

// Sobrescrever window.confirm global para retornar um modal baseado em Promise
window.customConfirm = function(message) {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "custom-modal-overlay";
    overlay.innerHTML = `
      <div class="custom-modal-card">
        <h3 style="margin-bottom: 12px; font-weight: 800; color: #fff;">Confirmação</h3>
        <p style="font-size: 14px; color: var(--text-secondary); margin-bottom: 24px; line-height: 1.5;">${message}</p>
        <div style="display: flex; gap: 12px; justify-content: center;">
          <button class="btn btn-ghost" id="confirm-btn-cancel" style="flex-grow: 1; padding: 10px;">Cancelar</button>
          <button class="btn" id="confirm-btn-ok" style="flex-grow: 1; padding: 10px; background-color: var(--accent-color); border-color: var(--accent-color); color: #fff; font-weight: 700;">Confirmar</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(overlay);

    overlay.querySelector("#confirm-btn-ok").addEventListener("click", () => {
      overlay.remove();
      resolve(true);
    });

    overlay.querySelector("#confirm-btn-cancel").addEventListener("click", () => {
      overlay.remove();
      resolve(false);
    });
  });
};
