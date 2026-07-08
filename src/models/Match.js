const { db, admin } = require("../config/firebase");

class Match {
  static async getAll() {
    if (!db) return [];
    const snap = await db.collection("matches").orderBy("date", "asc").get();
    const list = [];
    snap.forEach(doc => {
      list.push({ id: doc.id, ...doc.data() });
    });
    return list;
  }

  static async getById(id) {
    if (!db) return null;
    const doc = await db.collection("matches").doc(id).get();
    return doc.exists ? { id: doc.id, ...doc.data() } : null;
  }

  static async create(data) {
    if (!db) return null;
    const ref = await db.collection("matches").add({
      ...data,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    return { id: ref.id, ...data };
  }

  static async update(id, data) {
    if (!db) return null;
    await db.collection("matches").doc(id).update({
      ...data,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    return { id, ...data };
  }

  static async delete(id) {
    if (!db) return;
    await db.collection("matches").doc(id).delete();
  }

  static async autoCreateSemisIfGroupsDone() {
    if (!db) return false;
    
    // Verificar se as semifinais já existem
    const matchesSnap = await db.collection("matches").get();
    const allMatches = [];
    matchesSnap.forEach(d => { allMatches.push({ id: d.id, ...d.data() }); });
    
    const semisExist = allMatches.some(m => m.stage === "semifinal");
    if (semisExist) return false; // Semifinais já criadas

    // Filtrar partidas de grupo
    const groupMatches = allMatches.filter(m => m.stage === "groups");
    if (groupMatches.length === 0) return false;

    // Verificar se todas as partidas de grupo estão resolvidas (e não são postponed/adiadas indefinidamente)
    const allResolved = groupMatches.every(m => m.result && m.result !== "postponed");
    if (!allResolved) return false;

    // Calcular classificação final dos grupos A e B
    const playersSnap = await db.collection("players").get();
    const players = [];
    playersSnap.forEach(d => { players.push({ id: d.id, ...d.data() }); });

    // Função para calcular estatísticas de um jogador
    const computeStats = (playerId) => {
      const pMatches = groupMatches.filter(m => m.aId === playerId || m.bId === playerId);
      let points = 0, wins = 0, draws = 0, losses = 0, played = 0;
      
      for (const m of pMatches) {
        played++;
        if (m.result === "draw") {
          draws++; points += 1;
        } else if (m.result === "A") {
          if (m.aId === playerId) { wins++; points += 3; } else { losses++; }
        } else if (m.result === "B") {
          if (m.bId === playerId) { wins++; points += 3; } else { losses++; }
        }
      }
      return { points, wins, draws, losses, played };
    };

    const getStandings = (group) => {
      const groupPlayers = players.filter(p => p.group === group);
      const rows = groupPlayers.map(p => ({
        id: p.id,
        name: p.name,
        ...computeStats(p.id)
      }));

      // Primeiro desempate: Confronto Direto
      const headToHeadCompare = (aId, bId) => {
        const m = groupMatches.find(x => 
          ((x.aId === aId && x.bId === bId) || (x.aId === bId && x.bId === aId))
        );
        if (!m || !m.result || m.result === "draw") return 0;
        if (m.result === "A") return (m.aId === aId) ? -1 : 1;
        if (m.result === "B") return (m.bId === aId) ? -1 : 1;
        return 0;
      };

      const compare = (a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        const h2h = headToHeadCompare(a.id, b.id);
        if (h2h !== 0) return h2h;
        return (b.wins - a.wins) || a.name.localeCompare(b.name);
      };

      return rows.sort(compare);
    };

    const standingsA = getStandings("A");
    const standingsB = getStandings("B");

    if (standingsA.length < 2 || standingsB.length < 2) return false;

    const firstA = standingsA[0].id;
    const secondA = standingsA[1].id;
    const firstB = standingsB[0].id;
    const secondB = standingsB[1].id;

    // Criar partidas da Semifinal
    // Semi 1: 1ºA x 2ºB
    // Semi 2: 1ºB x 2ºA
    const batch = db.batch();
    
    const semi1Ref = db.collection("matches").doc();
    batch.set(semi1Ref, {
      aId: firstA,
      bId: secondB,
      stage: "semifinal",
      group: null,
      code: "SF1",
      result: null,
      date: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    const semi2Ref = db.collection("matches").doc();
    batch.set(semi2Ref, {
      aId: firstB,
      bId: secondA,
      stage: "semifinal",
      group: null,
      code: "SF2",
      result: null,
      date: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    await batch.commit();
    console.log("Semifinais autogeradas com sucesso!");
    return true;
  }
}

module.exports = Match;
