const { db, admin } = require("../config/firebase");

class User {
  static async getProfile(uid) {
    if (!db) return null;
    const snap = await db.collection("profiles").doc(uid).get();
    return snap.exists ? { id: snap.id, ...snap.data() } : null;
  }

  static async createOrUpdateProfile(uid, data) {
    if (!db) return null;
    const ref = db.collection("profiles").doc(uid);
    const payload = {
      ...data,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    await ref.set(payload, { merge: true });
    return { id: uid, ...payload };
  }

  static async getWallet(uid) {
    if (!db) return { points: 0 };
    const snap = await db.collection("wallets").doc(uid).get();
    if (!snap.exists) return null;
    return { id: snap.id, ...snap.data() };
  }

  static async ensureWallet(uid, email) {
    if (!db) return;
    const ref = db.collection("wallets").doc(uid);
    
    try {
      await db.runTransaction(async (tx) => {
        const snap = await tx.get(ref);
        if (!snap.exists) {
          tx.set(ref, {
            points: 6, // Saldo inicial: 6 CCIP
            email: email || null,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            lastWeeklyAt: admin.firestore.FieldValue.serverTimestamp()
          });
        } else {
          const data = snap.data();
          const updates = {};
          if (!data.email && email) updates.email = email;
          if (!data.lastWeeklyAt) updates.lastWeeklyAt = admin.firestore.FieldValue.serverTimestamp();
          
          if (Object.keys(updates).length > 0) {
            tx.set(ref, {
              ...updates,
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
          }
        }
      });
    } catch (e) {
      console.warn("Transação de carteira falhou, usando fallback: ", e.message);
      // Fallback sem transação
      const snap = await ref.get();
      if (!snap.exists) {
        await ref.set({
          points: 6,
          email: email || null,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          lastWeeklyAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
    }
  }

  static async grantWeeklyBonus(uid) {
    if (!db) return;
    const ref = db.collection("wallets").doc(uid);
    const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

    try {
      await db.runTransaction(async (tx) => {
        const snap = await tx.get(ref);
        if (!snap.exists) return;
        const d = snap.data();
        
        let last = 0;
        if (d.lastWeeklyAt) {
          last = d.lastWeeklyAt.toMillis ? d.lastWeeklyAt.toMillis() : (d.lastWeeklyAt._seconds * 1000 || 0);
        }
        
        const now = Date.now();
        if (!last) {
          tx.update(ref, { lastWeeklyAt: admin.firestore.FieldValue.serverTimestamp() });
          return;
        }

        const diff = now - last;
        const weeks = Math.floor(diff / ONE_WEEK_MS);
        if (weeks >= 1) {
          const toGive = weeks * 6; // 6 CCIP por semana
          tx.update(ref, {
            points: admin.firestore.FieldValue.increment(toGive),
            lastWeeklyAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          console.log(`Bônus semanal de ${toGive} CCIP concedido para UID: ${uid}`);
        }
      });
    } catch (err) {
      console.warn("grantWeeklyBonus erro:", err.message);
    }
  }

  static async getRankings() {
    if (!db) return { bestByWins: [], mostPoints: [], mostBets: [], profilesMap: {}, walletsMap: {} };

    // Buscar carteiras, perfis e apostas
    const [betsSnap, walletsSnap, profilesSnap] = await Promise.all([
      db.collection("bets").get(),
      db.collection("wallets").get(),
      db.collection("profiles").get()
    ]);

    const profilesMap = {};
    profilesSnap.forEach(d => { profilesMap[d.id] = d.data(); });
    
    const walletsMap = {};
    walletsSnap.forEach(d => { walletsMap[d.id] = d.data(); });

    // Buscar partidas para verificar resultados das apostas
    const matchesSnap = await db.collection("matches").get();
    const matches = [];
    matchesSnap.forEach(d => { matches.push({ id: d.id, ...d.data() }); });

    const byUser = {};
    betsSnap.forEach(d => {
      const b = d.data();
      const uid = b.uid;
      if (!uid) return;
      
      if (!byUser[uid]) byUser[uid] = { total: 0, wins: 0 };
      byUser[uid].total++;

      const m = matches.find(x => x.id === b.matchId);
      if (m && m.result && m.result !== "postponed") {
        const ok = (b.pick === "draw" && m.result === "draw") || 
                   (b.pick === "A" && m.result === "A") || 
                   (b.pick === "B" && m.result === "B");
        if (ok) byUser[uid].wins++;
      }
    });

    const bestByWins = Object.entries(byUser)
      .map(([uid, v]) => ({
        uid,
        wins: v.wins,
        total: v.total,
        rate: v.total ? v.wins / v.total : 0
      }))
      .sort((a, b) => (b.wins - a.wins) || (b.rate - a.rate) || (b.total - a.total))
      .slice(0, 10);

    const mostPoints = Object.entries(walletsMap)
      .map(([uid, w]) => {
        const pts = typeof w.points === "number" ? w.points : parseFloat(w.points) || 0;
        return { uid, pts, email: w.email || profilesMap[uid]?.email || "" };
      })
      .sort((a, b) => b.pts - a.pts)
      .slice(0, 10);

    const mostBets = Object.entries(byUser)
      .map(([uid, v]) => ({ uid, total: v.total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    return { bestByWins, mostPoints, mostBets, profilesMap, walletsMap };
  }

  static async isAdmin(uid) {
    if (!db || !uid) return false;
    const snap = await db.collection("admins").doc(uid).get();
    return snap.exists && (!!snap.data().active || !!snap.data().isAdmin);
  }
}

module.exports = User;
