# Documentação de Desenvolvimento - Champions Chess INFO

Este arquivo detalha as mudanças realizadas no projeto, a nova arquitetura do sistema e as instruções manuais necessárias para colocar a plataforma em funcionamento.

---

## 🏗️ Nova Arquitetura: Divisão Front-end / Back-end (MVC)

Para resolver a vulnerabilidade de exposição das credenciais do Firebase e requisições diretas feitas a partir do navegador, o projeto foi reestruturado em uma arquitetura **MVC (Model-View-Controller)** completa:

- **View (Public)**: Contém apenas páginas HTML estáticas, arquivos CSS responsivos e scripts JS simples. O front-end **não possui acesso direto ao banco de dados do Firebase**. Todas as comunicações são feitas via chamadas seguras `fetch` para a API do nosso servidor back-end.
- **Model (src/models)**: Classes que encapsulam a lógica de leitura e escrita do banco de dados (Firestore e Realtime Database) utilizando o SDK administrativo do Firebase no servidor.
- **Controller (src/controllers)**: Controladores Express que recebem as requisições do front-end, validam sessões, calculam probabilidades de apostas de forma segura e gerenciam as regras do torneio.

---

## 🔒 Melhorias de Cibersegurança e Antivulnerabilidade

1. **Proteção Anti-F12 e Inspeção**: Adicionado o script `public/js/security.js` que desativa o clique direito (Context Menu), atalhos de desenvolvedor (`F12`, `Ctrl+Shift+I`, `Ctrl+Shift+J`, `Ctrl+Shift+C`) e a visualização do código-fonte (`Ctrl+U`). Além disso, implementa um loop com `debugger` infinito para congelar a execução do console caso tentem forçar sua abertura.
2. **Proxy de Banco de Dados**: Nenhuma chave ou regra de escrita do Firestore/RTDB está disponível no cliente. O Firebase do cliente é inicializado **exclusivamente na tela de perfil para autenticação inicial do Google**. O token gerado (`ID Token`) é transmitido via headers criptografados para o back-end, que valida o token usando chaves criptográficas oficiais do Google.
3. **Gateway de Captcha Simples**: Na primeira visita, o usuário é direcionado para a página `captcha.html`. Ele deve resolver uma equação aritmética simples gerada pelo servidor e salva em cookie assinado. Apenas após a resolução correta, um cookie seguro de liberação é configurado para permitir navegação no site, repelindo requisições automatizadas de robôs.

---

## ♟️ Funcionalidades Aprimoradas e Novas Mecânicas

- **Matchmaking (Prontidão de Partida)**: Jogadores escalados para um confronto podem acessar a página de partidas e clicar em "Estou Pronto". Se ambos sinalizarem prontidão no mesmo período, a partida muda automaticamente para "AO VIVO (Live)", exibindo um indicador pulsante para os espectadores.
- **Cadastro com Escolha de Papel**: Ao logar, o usuário escolhe se quer ser **Espectador** (cadastro imediato) ou **Participante** (entra na fila de espera). O Administrador analisa e aprova a entrada diretamente na interface do site.
- **Apostas de Alta Performance**: Cálculo dinâmico de probabilidades (V-E-D) e retornos estimados (payouts) processados de forma síncrona pelo servidor a partir do histórico de vitórias/empates dos enxadristas. Reconciliação e pagamentos de carteira são feitos em lote no servidor quando a partida é resolvida pelo admin.
- **Armazenamento Otimizado (Base64)**: Upload de imagem de perfil é redimensionado para `128x128` pixels e convertido para JPEG compactado em Base64 no próprio navegador do usuário (mantendo arquivos com menos de 15KB). O string resultante é salvo diretamente no documento do usuário no Firestore, evitando custos e limites do Storage no plano gratuito.
- **Auto-clean do Chat**: Um job automático roda a cada 5 horas no servidor Express e remove mensagens antigas do Realtime Database, prevenindo estouro de armazenamento do plano gratuito Spark.

---

## 🛠️ Ações Manuais Obrigatórias no Firebase Console

Como o agente não possui acesso direto à interface do seu Firebase Console, você deve realizar as seguintes etapas de configuração:

### 1. Obter arquivo de credenciais da Conta de Serviço (JSON)
1. Acesse o [Firebase Console](https://console.firebase.google.com/).
2. Abra seu projeto **champions-chess-info**.
3. Clique na engrenagem de **Configurações do Projeto** e vá na aba **Contas de Serviço**.
4. Clique em **Gerar nova chave privada** e baixe o arquivo JSON.
5. Renomeie o arquivo baixado para `firebase-service-account.json` e coloque-o na **raiz** deste projeto.

### 2. Ativar Métodos de Autenticação
1. No menu lateral do Firebase, vá em **Build -> Authentication**.
2. Clique em **Get Started** e ative o provedor **Google**.
3. Adicione o seu domínio (ex: `localhost`, `champions-chess-info.firebaseapp.com`) na lista de domínios autorizados.

### 3. Configurar Regras de Segurança
Configure as regras de banco de dados para **Bloqueio Total Externo**, pois todo o tráfego deve passar exclusivamente pelas credenciais administrativas do servidor back-end:

#### Regras do Cloud Firestore:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Bloquear todo acesso direto do cliente (F12)
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

#### Regras do Realtime Database:
```json
{
  "rules": {
    ".read": false,
    ".write": false
  }
}
```

### 4. Definir o Primeiro Administrador
Para ter acesso ao Painel de Administração (`/admin`), você precisa marcar seu usuário como admin no banco de dados:
1. Faça login na plataforma com sua conta Google pelo menos uma vez (para que seu UID seja criado).
2. Vá no Firebase Console -> **Firestore Database**.
3. Crie uma coleção chamada `admins`.
4. Adicione um documento onde o **ID do documento** seja o seu **UID** (que você pode obter na aba Authentication ou no campo `uid` do seu perfil no site).
5. Defina um campo do tipo booleano: `active: true` ou `isAdmin: true`.

---

## 🚀 Como Iniciar o Projeto Localmente

1. Certifique-se de que o arquivo `firebase-service-account.json` esteja na raiz do projeto.
2. Certifique-se de ter o arquivo `.env` configurado.
3. Instale as dependências:
   ```bash
   npm install
   ```
4. Inicie o servidor em modo de desenvolvimento (reinicia automaticamente ao salvar arquivos):
   ```bash
   npm run dev
   ```
5. Acesse a plataforma no navegador em: `http://localhost:3000`.
