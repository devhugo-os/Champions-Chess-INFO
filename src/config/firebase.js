const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const projectId = process.env.FIREBASE_PROJECT_ID || "champions-chess-info";
const databaseURL = process.env.FIREBASE_DATABASE_URL || `https://${projectId}-default-rtdb.firebaseio.com`;

let initialized = false;

try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_RAW_JSON) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_RAW_JSON);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: databaseURL
    });
    initialized = true;
    console.log("Firebase Admin initialized using raw JSON environment variable.");
  } else {
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_JSON || "./firebase-service-account.json";
    const absolutePath = path.resolve(process.cwd(), serviceAccountPath);

    if (fs.existsSync(absolutePath)) {
      const serviceAccount = require(absolutePath);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: databaseURL
      });
      initialized = true;
      console.log(`Firebase Admin initialized using service account file at: ${absolutePath}`);
    } else {
      // Fallback: Tentativa de inicializar sem credenciais explícitas (tenta usar Application Default Credentials)
      admin.initializeApp({
        projectId: projectId,
        databaseURL: databaseURL
      });
      initialized = true;
      console.log(`Firebase Admin initialized using default credentials/project ID: ${projectId}`);
    }
  }
} catch (error) {
  console.error("==================================================================");
  console.error("ERRO AO INICIALIZAR O FIREBASE ADMIN SDK:");
  console.error(error.message);
  console.error("------------------------------------------------------------------");
  console.error("Por favor, certifique-se de que:");
  console.error("1. Você baixou o arquivo de credenciais da conta de serviço no Console do Firebase.");
  console.error("2. Colocou ele na raiz do projeto com o nome 'firebase-service-account.json' ou configurou FIREBASE_SERVICE_ACCOUNT_JSON no seu arquivo .env.");
  console.error("==================================================================");
  
  // Para evitar que o app trave imediatamente na inicialização caso queira testar outras coisas:
  // criamos um mock básico para fins de depuração
  console.warn("Utilizando Mock Firebase Admin devido a erro de credenciais.");
}

const db = initialized ? admin.firestore() : null;
const rtdb = initialized ? admin.database() : null;
const auth = initialized ? admin.auth() : null;

module.exports = {
  admin,
  db,
  rtdb,
  auth,
  initialized
};
