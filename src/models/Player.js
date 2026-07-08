const { db, admin } = require("../config/firebase");

class Player {
  static async getAll() {
    if (!db) return [];
    const snap = await db.collection("players").orderBy("name", "asc").get();
    const list = [];
    snap.forEach(doc => {
      list.push({ id: doc.id, ...doc.data() });
    });
    return list;
  }

  static async getById(id) {
    if (!db) return null;
    const doc = await db.collection("players").doc(id).get();
    return doc.exists ? { id: doc.id, ...doc.data() } : null;
  }

  static async create(data) {
    if (!db) return null;
    const ref = await db.collection("players").add({
      name: data.name,
      group: data.group || "A",
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    return { id: ref.id, ...data };
  }

  static async update(id, data) {
    if (!db) return null;
    await db.collection("players").doc(id).update({
      name: data.name,
      group: data.group,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    return { id, ...data };
  }

  static async delete(id) {
    if (!db) return;
    await db.collection("players").doc(id).delete();
  }

  // Obter lista de espera para participantes
  static async getWaitlist() {
    if (!db) return [];
    // Usuários com campo roleSelection = "participant" e participantStatus = "pending"
    const snap = await db.collection("profiles")
      .where("roleSelection", "==", "participant")
      .where("participantStatus", "==", "pending")
      .get();
    
    const list = [];
    snap.forEach(doc => {
      list.push({ uid: doc.id, ...doc.data() });
    });
    return list;
  }

  // Aprovar inscrição de participante
  static async approveParticipant(uid, group) {
    if (!db) return false;
    
    const profileRef = db.collection("profiles").doc(uid);
    const playersColl = db.collection("players");

    try {
      await db.runTransaction(async (tx) => {
        const profileSnap = await tx.get(profileRef);
        if (!profileSnap.exists) throw new Error("Perfil não encontrado");
        
        const profileData = profileSnap.data();
        
        // Criar o registro na coleção de jogadores
        const newPlayerRef = playersColl.doc(uid); // Usa o UID como id para consistência
        tx.set(newPlayerRef, {
          name: profileData.displayName || profileData.name || "Jogador",
          group: group || "A",
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // Atualizar o perfil do usuário
        tx.update(profileRef, {
          participantStatus: "approved",
          role: "participant",
          assignedPlayerId: uid,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      });
      console.log(`Participante aprovado: ${uid}`);
      return true;
    } catch (e) {
      console.error("Erro ao aprovar participante: ", e.message);
      return false;
    }
  }

  // Rejeitar inscrição de participante
  static async rejectParticipant(uid) {
    if (!db) return false;
    const profileRef = db.collection("profiles").doc(uid);
    await profileRef.update({
      participantStatus: "rejected",
      roleSelection: "spectator", // Volta a ser espectador
      role: "spectator",
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    return true;
  }
}

module.exports = Player;
