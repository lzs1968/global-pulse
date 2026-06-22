(function () {
  function ensureHeaderActions() {
    document.querySelectorAll(".header-inner").forEach((inner) => {
      if (!inner.querySelector(".header-actions")) {
        const div = document.createElement("div");
        div.className = "header-actions";
        inner.appendChild(div);
      }
    });
  }

  function init() {
    ensureHeaderActions();
    if (window.GP_FOOTER) window.GP_FOOTER.mountFooter();
    if (window.GP_I18N) window.GP_I18N.injectLangButton();
    if (window.GP_UI) window.GP_UI.injectIconPlaceholders();
  }

  document.addEventListener("DOMContentLoaded", init);
  window.GP_LAYOUT = { init };
})();
