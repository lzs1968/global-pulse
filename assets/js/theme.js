(function () {
  function getTheme() {
    return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
  }

  function setTheme(theme) {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("gp-theme", theme);
    document.querySelectorAll("[data-theme-toggle]").forEach((btn) => {
      btn.setAttribute("aria-label", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
      btn.textContent = theme === "dark" ? "☀" : "☾";
    });
  }

  function toggleTheme() {
    setTheme(getTheme() === "dark" ? "light" : "dark");
  }

  function injectToggle() {
    document.querySelectorAll(".header-actions").forEach((actions) => {
      if (actions.querySelector("[data-theme-toggle]")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "theme-toggle";
      btn.dataset.themeToggle = "";
      btn.addEventListener("click", toggleTheme);
      actions.insertBefore(btn, actions.firstChild);
      setTheme(getTheme());
    });
  }

  if (window.matchMedia) {
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
      if (!localStorage.getItem("gp-theme")) {
        setTheme(e.matches ? "dark" : "light");
      }
    });
  }

  document.addEventListener("DOMContentLoaded", injectToggle);
})();
