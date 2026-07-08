const { db, admin } = require("../config/firebase");

class Bet {
  static async getByUser(uid) {
    if (!db) return [];
    const snap = await db.collection("bets")
      .where("uid", "==", uid)
      .get();
    
    const list = [];
    snap.forEach(doc => {
      list.push({ id: doc.id, ...doc.data() });
    });
    return list;
  }

  static async getAll() {
    if (!db) return [];
    const snap = await db.collection("bets").get();
    const list = [];
    snap.forEach(doc => {
      list.push({ id: doc.id, ...doc.data() });
    });
    return list;
  }

  static async create(uid, matchId, pick, payoutPoints, stake = 2, tournamentId = 1) {
    if (!db) throw new Error("Firebase não inicializado.");

    const betDocId = `bet_${uid}_${matchId}`;
    const betRef = db.collection("bets").doc(betDocId);
    const walletRef = db.collection("wallets").doc(uid);

    let success = false;
    let refundAmount = stake;

    await db.runTransaction(async (tx) => {
      const [betSnap, walletSnap] = await Promise.all([
        tx.get(betRef),
        tx.get(walletRef)
      ]);

      if (betSnap.exists) {
        throw new Error("Você já realizou uma aposta nesta partida.");
      }

      let curPoints = 6; // Seed padrão
      if (walletSnap.exists) {
        curPoints = walletSnap.data().points || 0;
      }

      if (curPoints < stake) {
        throw new Error("Saldo insuficiente de CCIP.");
      }

      // Subtrair stake da carteira
      tx.update(walletRef, {
        points: admin.firestore.FieldValue.increment(-stake),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Gravar aposta
      tx.set(betRef, {
        uid,
        matchId,
        pick,
        stake,
        payoutPoints,
        status: "pendente",
        tournament: tournamentId,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      success = true;
    });

    return { success, id: betDocId, stake };
  }

  static async undo(uid, betId) {
    if (!db) throw new Error("Firebase não inicializado.");
    const betRef = db.collection("bets").doc(betId);
    const walletRef = db.collection("wallets").doc(uid);

    let success = false;

    await db.runTransaction(async (tx) => {
      const [betSnap, walletSnap] = await Promise.all([
        tx.get(betRef),
        tx.get(walletRef)
      ]);

      if (!betSnap.exists) {
        throw new Error("Aposta não encontrada ou já expirou.");
      }

      const betData = betSnap.data();
      if (betData.uid !== uid) {
        throw new Error("Não autorizado.");
      }
      if (betData.status !== "pendente") {
        throw new Error("Aposta já resolvida e não pode ser desfeita.");
      }

      const stake = betData.stake || 2;

      // Deletar aposta e devolver pontos
      tx.delete(betRef);
      tx.update(walletRef, {
        points: admin.firestore.FieldValue.increment(stake),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      success = true;
    });

    return success;
  }

  // Reconcilia todas as apostas para uma partida específica quando o resultado muda
  static async reconcileMatchBets(matchId, newResult) {
    if (!db) return;

    // Buscar todas as apostas para este match
    const betsSnap = await db.collection("bets").where("matchId", "==", matchId).get();
    if (betsSnap.empty) return;

    const batch = db.batch();
    const walletsToUpdate = {}; // { uid: delta }

    betsSnap.forEach(doc => {
      const b = doc.data();
      const betId = doc.id;
      const uid = b.uid;
      const stake = b.stake || 2;
      const payout = b.payoutPoints || 2;

      const previousStatus = b.status || "pendente";
      const previousSettledPayout = b.settledPayout || 0;

      let newStatus = "pendente";
      let newSettledPayout = 0;

      if (!newResult || newResult === "postponed") {
        // Se a partida foi cancelada/adiada ou voltou a pendente
        newStatus = newResult === "postponed" ? "postponed" : "pendente";
        newSettledPayout = newResult === "postponed" ? stake : 0; // Devolve o stake se for postponed
      } else {
        const isWin = (b.pick === "draw" && newResult === "draw") || 
                      (b.pick === "A" && newResult === "A") || 
                      (b.pick === "B" && newResult === "B");
        newStatus = isWin ? "ganhou" : "perdeu";
        newSettledPayout = isWin ? payout : 0;
      }

      if (previousStatus !== newStatus || previousSettledPayout !== newSettledPayout) {
        // Atualizar documento de aposta
        const betRef = db.collection("bets").doc(betId);
        batch.update(betRef, {
          status: newStatus,
          settledPayout: newSettledPayout,
          settledAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // Calcular diferença para atualizar carteira
        const delta = newSettledPayout - previousSettledPayout;
        if (delta !== 0) {
          if (!walletsToUpdate[uid]) walletsToUpdate[uid] = 0;
          walletsToUpdate[uid] += delta;
        }
      }
    });

    // Atualizar carteiras dos usuários
    for (const [uid, delta] of Object.entries(walletsToUpdate)) {
      if (delta !== 0) {
        const walletRef = db.collection("wallets").doc(uid);
        batch.set(walletRef, {
          points: admin.firestore.FieldValue.increment(delta),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
      }
    }

    await batch.commit();
    console.log(`Apostas reconciliadas para a partida ${matchId} (Resultado: ${newResult})`);
  }
}

module.exports = Bet;
