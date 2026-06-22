(function () {
  function showPage() {
    if (document.body) document.body.classList.add("is-ready");
  }

  // 防止 JS 未完全加载时页面一直透明（body { opacity: 0 }）
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", showPage);
  } else {
    showPage();
  }
  setTimeout(showPage, 800);

  try {
    var stored = localStorage.getItem("gp-theme");
    var dark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.dataset.theme = stored || (dark ? "dark" : "light");
    document.documentElement.lang = "en";
    localStorage.setItem("gp-lang", "en");
  } catch (e) {
    document.documentElement.dataset.theme = "light";
  }
})();
