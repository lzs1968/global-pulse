/**
 * GP_PRO — Pro 会员态（MVP 客户端实现）
 *
 * 当前在静态站内用 localStorage 保存会员态，足以驱动“去广告 / PRO 徽标 / 会员专享”逻辑做演示。
 * Demo Pro membership stored in localStorage. Replace isPro() with a backend check when you add payments.
 */
(function () {
  const KEY = "gp-pro";

  function read() {
    try {
      return JSON.parse(localStorage.getItem(KEY) || "null");
    } catch {
      return null;
    }
  }

  function isPro() {
    const s = read();
    return !!(s && s.active);
  }

  function getPlan() {
    const s = read();
    return s && s.active ? s.plan || "pro" : null;
  }

  function emit() {
    document.dispatchEvent(
      new CustomEvent("gp:pro-change", { detail: { pro: isPro() } })
    );
  }

  function activate(plan) {
    localStorage.setItem(
      KEY,
      JSON.stringify({ active: true, plan: plan || "pro", since: Date.now() })
    );
    syncBadge();
    emit();
  }

  function deactivate() {
    localStorage.removeItem(KEY);
    syncBadge();
    emit();
  }

  function syncBadge() {
    document.querySelectorAll(".header-actions").forEach((actions) => {
      let pill = actions.querySelector("[data-pro-pill]");
      if (isPro()) {
        if (!pill) {
          pill = document.createElement("span");
          pill.dataset.proPill = "";
          pill.className = "pro-pill";
          pill.textContent = "PRO";
          pill.title = "Pro member active · ad-free";
          actions.insertBefore(pill, actions.firstChild);
        }
      } else if (pill) {
        pill.remove();
      }
    });
  }

  document.addEventListener("DOMContentLoaded", syncBadge);

  window.GP_PRO = {
    isPro,
    getPlan,
    activate,
    deactivate,
    syncBadge,
    onChange(cb) {
      document.addEventListener("gp:pro-change", (e) => cb(e.detail.pro));
    },
  };
})();
