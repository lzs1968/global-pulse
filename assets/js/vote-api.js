/** Server-backed voting: one vote per IP per leader, changeable */
(function () {
  const API = "/api/vote";

  async function getVote(leaderId) {
    try {
      const res = await fetch(API + "?leaderId=" + encodeURIComponent(leaderId), {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("bad status");
      return await res.json();
    } catch {
      return { ok: false, choice: null, offline: true };
    }
  }

  async function submitVote(leaderId, choice) {
    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leaderId: leaderId, choice: choice }),
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) {
        return { ok: false, error: data.error || "Vote failed" };
      }
      return data;
    } catch {
      return { ok: false, offline: true, error: "Cannot reach vote service. Start the local server (see docs/LOCAL_DEV.md)." };
    }
  }

  window.GP_VOTE = { getVote: getVote, submitVote: submitVote };
})();
