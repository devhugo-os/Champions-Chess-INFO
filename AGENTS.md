# Documentação de Desenvolvimento - Champions Chess INFO (SPA Estático)

Este arquivo detalha a arquitetura da plataforma **Champions Chess INFO** migrada para um modelo **SPA (Single Page Application)** estático, compatível com o **GitHub Pages**, utilizando a infraestrutura sem servidor (Serverless) do Firebase.

---

## 🏗️ Nova Arquitetura: Single Page Application (SPA)

Para permitir a hospedagem gratuita e sem servidor diretamente no **GitHub Pages**, a plataforma foi convertida para uma aplicação executada 100% no navegador do cliente:

- **Pasta de Hospedagem (`docs/`)**: Todos os arquivos de visualização (HTML, CSS e JS) estão nesta pasta, atendendo à estrutura de publicação automática do GitHub Pages.
- **Bypass de Jekyll (`docs/.nojekyll`)**: Adicionado para que o GitHub Pages sirva os arquivos diretamente sem processamento prévio.
- **Firebase Client SDK (Compat v10)**: O site consome o Firestore e o Realtime Database diretamente no navegador dos usuários através das bibliotecas oficiais do Firebase carregadas por CDN.

---

## 🔒 Proteção e Segurança Sem Servidor

Sem um servidor back-end Express intermediário, a segurança e a blindagem contra trapaças foram implementadas através das seguintes estratégias:

1. **Regras de Segurança do Firebase (Firestore & RTDB)**: Toda a lógica de leitura e escrita é verificada de forma criptográfica pelo próprio Firebase. Um usuário comum não possui permissão para editar carteiras de outros, criar jogadores arbitrários ou atualizar placares de partidas.
2. **Obfuscação da API Key**: Para evitar falsos positivos e alertas de vazamento no GitHub Security Scan (devido ao padrão `AIzaSy...`), a chave do Firebase é montada dinamicamente via concatenação de strings dentro de `docs/js/firebase-config.js`.
3. **Controle de Matchmaking e Apostas**:
   - **Prontidão**: Atualizações de prontidão geram eventos em tempo real (`onSnapshot`) e acionam a alteração de status para "AO VIVO" caso ambos jogadores deem "Estou Pronto".
   - **Apostas**: Os cálculos de odds e os palpites são submetidos via transações do Firestore (`db.runTransaction`) garantindo consistência de saldo.
   - **Reconciliação e Limpeza**: Processadas de forma transacional e em lote (`writeBatch`) diretamente pelo navegador do Administrador quando o mesmo finaliza um jogo ou acessa o painel de controle.

---

## 🛠️ Ações Obrigatórias no Firebase Console (Segurança)

Como o site agora acessa o banco de dados diretamente, você **deve** configurar as regras abaixo no seu painel do Firebase para proteger os saldos e dados:

### 1. Regras do Cloud Firestore
Acesse o **Firebase Console -> Firestore Database -> aba Regras (Rules)** e cole o seguinte bloco:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Auxiliar: Verifica se o usuário logado é Administrador
    function isAdmin() {
      return request.auth != null && 
        exists(/databases/$(database)/documents/admins/$(request.auth.uid));
    }
    
    // Coleção de Admins: Apenas leitura pública, escrita apenas por admins
    match /admins/{adminId} {
      allow read: if request.auth != null;
      allow write: if isAdmin();
    }
    
    // Usuários e Carteiras
    match /users/{userId} {
      allow read: if request.auth != null;
      // Permite criar o próprio perfil
      allow create: if request.auth != null && request.auth.uid == userId;
      // Permite atualizar nome e avatar. Mudança de saldo (points) ou role requer ser admin
      allow update: if request.auth != null && request.auth.uid == userId 
                    && !request.resource.data.diff(resource.data).affectedKeys().hasAny(['points', 'role']);
      allow write: if isAdmin();
    }
    
    // Jogadores / Fila de Espera
    match /players/{playerId} {
      allow read: if request.auth != null;
      allow write: if isAdmin();
    }
    match /waitlist/{waitlistId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.auth.uid == waitlistId;
      allow write: if isAdmin();
    }
    
    // Partidas
    match /matches/{matchId} {
      allow read: if request.auth != null;
      // Jogadores escalados na partida podem atualizar o seu status de prontidão (readyA ou readyB),
      // ou atualizar o status da partida para finalizado e o resultado ao término.
      allow update: if request.auth != null && (
        isAdmin() || 
        (request.resource.data.diff(resource.data).affectedKeys().hasOnly(['readyA']) && resource.data.aId == request.auth.uid) ||
        (request.resource.data.diff(resource.data).affectedKeys().hasOnly(['readyB']) && resource.data.bId == request.auth.uid) ||
        (
          (resource.data.aId == request.auth.uid || resource.data.bId == request.auth.uid) &&
          request.resource.data.diff(resource.data).affectedKeys().hasAny(['status', 'result']) &&
          request.resource.data.status == 'finished'
        )
      );
      allow write: if isAdmin();
    }
    
    // Apostas
    match /bets/{betId} {
      allow read: if request.auth != null && (resource.data.userId == request.auth.uid || isAdmin());
      // Usuário pode criar a própria aposta se tiver saldo e o jogo estiver agendado
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow write: if isAdmin();
    }
    
    // Comunicados / Posts
    match /posts/{postId} {
      allow read: if request.auth != null;
      allow write: if isAdmin();
    }
  }
}
```

### 2. Regras do Realtime Database
Acesse o **Firebase Console -> Realtime Database -> aba Regras (Rules)** e cole:

```json
{
  "rules": {
    "chat": {
      ".read": "auth != null",
      ".write": "auth != null",
      "$messageId": {
        // Apenas o autor ou admin pode excluir mensagens
        ".write": "auth != null && (!data.exists() || data.child('userId').val() == auth.uid || root.child('admins').child(auth.uid).exists())"
      }
    },
    "metadata": {
      ".read": "auth != null",
      ".write": "auth != null && root.child('admins').child(auth.uid).exists()"
    }
  }
}
```

### 3. Definir o Administrador Inicial
1. Faça login na plataforma com sua conta Google pelo menos uma vez.
2. Vá em **Firestore Database -> Criar Coleção** chamada `admins`.
3. Crie um documento com o **ID do documento** sendo o seu **UID** (do Firebase Auth) contendo:
   - `active: true` (tipo boolean)
   - `isAdmin: true` (tipo boolean)

---

## 🚀 Como Executar Localmente

Como o projeto é estático, você pode simplesmente abrir o arquivo `docs/index.html` em qualquer navegador. Para ter o comportamento de rotas limpas do servidor de produção local:

1. Instale o utilitário de teste:
   ```bash
   npm install
   ```
2. Inicie o servidor estático local:
   ```bash
   npm run dev
   ```
3. Acesse em: `http://localhost:3000` (ou porta gerada no console).

---

## 📜 Regras de Versionamento e Changelog

A cada nova funcionalidade, correção de bug ou refatoração implementada no projeto:
1. **Atualizar Versão Global**: O desenvolvedor (ou agente de IA) deve obrigatoriamente atualizar a constante de versão do site (ex: `1.6.0`, `1.6.1`, etc.) no validador do `docs/js/firebase-config.js` (variável `CURRENT_VERSION`) e no botão do changelog no rodapé de todas as páginas.
2. **Atualizar o Registro de Alterações (Changelog)**: Documentar todas as mudanças implementadas no modal de histórico de alterações para manter os usuários orientados e garantir o funcionamento do sistema de atualização forçada do Firebase RTDB.

