// security.js — Bloqueio de console, F12, clique direito e atalhos de inspeção

(function() {
  function isUserAdmin() {
    try {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const user = JSON.parse(userStr);
        return (user.role === "admin" || user.isAdmin === true);
      }
    } catch (e) {}
    return false;
  }

  // Desabilitar clique direito
  document.addEventListener("contextmenu", (e) => {
    if (isUserAdmin()) return;
    e.preventDefault();
    showNotice();
  });

  // Desabilitar atalhos de desenvolvedor
  document.addEventListener("keydown", (e) => {
    if (isUserAdmin()) return;
    // F12
    if (e.key === "F12" || e.keyCode === 123) {
      e.preventDefault();
      showNotice();
    }
    // Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C
    if (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "J" || e.key === "C" || e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 67)) {
      e.preventDefault();
      showNotice();
    }
    // Ctrl+U (Ver código fonte)
    if (e.ctrlKey && (e.key === "u" || e.key === "U" || e.keyCode === 85)) {
      e.preventDefault();
      showNotice();
    }
    // Ctrl+S (Salvar página)
    if (e.ctrlKey && (e.key === "s" || e.key === "S" || e.keyCode === 83)) {
      e.preventDefault();
      showNotice();
    }
  });

  // Mostrar aviso de segurança na tela
  function showNotice() {
    let notice = document.getElementById("block-notice");
    if (!notice) {
      notice = document.createElement("div");
      notice.id = "block-notice";
      notice.innerHTML = `
        <div style="background: rgba(22, 30, 41, 0.95); border: 1px solid #ef4444; padding: 30px; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
          <h1 style="color:#ef4444; font-size:22px; margin-bottom:12px; font-weight:800;">Acesso Protegido</h1>
          <p style="color:#8b949e; font-size:14px; margin-bottom:20px;">
            Por motivos de cibersegurança e para proteger nosso banco de dados, o uso de ferramentas de desenvolvedor (F12, Inspeção, Clique Direito) está desativado neste site.
          </p>
          <button class="btn" onclick="document.getElementById('block-notice').remove()" style="padding:10px 20px;">Entendi</button>
        </div>
      `;
      // Estilo rápido
      notice.style.position = "fixed";
      notice.style.top = "0";
      notice.style.left = "0";
      notice.style.width = "100vw";
      notice.style.height = "100vh";
      notice.style.backgroundColor = "rgba(6, 9, 14, 0.85)";
      notice.style.backdropFilter = "blur(8px)";
      notice.style.display = "flex";
      notice.style.alignItems = "center";
      notice.style.justifyContent = "center";
      notice.style.zIndex = "999999";
      
      document.body.appendChild(notice);
    }
  }

  // Truque do Debugger infinito para atrapalhar inspeção caso consigam forçar a abertura
  setInterval(function() {
    if (isUserAdmin()) return;
    (function() {
      try {
        (function a(i) {
          if (("" + i / i).length !== 1 || i % 20 === 0) {
            (function() {}).constructor("debugger")();
          } else {
            debugger;
          }
          a(++i);
        })(0);
      } catch (e) {}
    })();
  }, 1000);
})();
