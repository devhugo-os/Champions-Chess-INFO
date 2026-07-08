const { rtdb } = require("../config/firebase");

class Chat {
  static async addMessage(uid, name, email, text) {
    if (!rtdb) return null;
    const chatRef = rtdb.ref("chat");
    const newMsgRef = chatRef.push();
    const payload = {
      uid,
      name: name || email.split("@")[0],
      email: email || "",
      text,
      ts: Date.now()
    };
    await newMsgRef.set(payload);
    return { id: newMsgRef.key, ...payload };
  }

  static async deleteMessage(msgId) {
    if (!rtdb) return;
    await rtdb.ref(`chat/${msgId}`).remove();
  }

  static async autoClean() {
    if (!rtdb) return;
    
    const chatRef = rtdb.ref("chat");
    const fiveHoursAgo = Date.now() - (5 * 60 * 60 * 1000); // 5 horas
    
    try {
      const snap = await chatRef.orderByChild("ts").endBefore(fiveHoursAgo).once("value");
      if (snap.exists()) {
        const updates = {};
        snap.forEach(child => {
          updates[child.key] = null; // Define como null para remover
        });
        await chatRef.update(updates);
        console.log(`[Auto-Clean] Chat limpo: ${Object.keys(updates).length} mensagens antigas deletadas.`);
      }
    } catch (error) {
      console.error("[Auto-Clean] Erro ao limpar chat:", error.message);
    }
  }
}

module.exports = Chat;
