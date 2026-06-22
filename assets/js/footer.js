(function () {
  function footerHtml() {
    return (
      '<div class="footer-grid">' +
      '<div class="footer-col">' +
      '<a class="brand" href="index.html" style="margin-bottom:16px;display:inline-flex;">' +
      '<span class="brand-mark"><span data-icon="globe"></span></span><span>Global Pulse</span></a>' +
      '<p class="footer-about" data-i18n="footer.about">Global leader approval signals · anonymous binary votes. Not official polling; no personal data sold.</p>' +
      "</div>" +
      '<div class="footer-col"><h4 data-i18n="footer.browse">Browse</h4><ul>' +
      '<li><a href="leaders.html" data-i18n="footer.leaders">Leaders</a></li>' +
      '<li><a href="map.html" data-i18n="footer.map">World map</a></li>' +
      '<li><a href="rankings.html" data-i18n="footer.rankings">Rankings</a></li>' +
      '<li><a href="timeline.html" data-i18n="footer.timeline">Timeline</a></li>' +
      "</ul></div>" +
      '<div class="footer-col"><h4 data-i18n="footer.trust">Trust</h4><ul>' +
      '<li><a href="methodology.html" data-i18n="footer.method">Methodology</a></li>' +
      '<li><a href="privacy.html" data-i18n="footer.privacy">Privacy</a></li>' +
      '<li><a href="terms.html" data-i18n="footer.terms">Terms</a></li>' +
      "</ul></div>" +
      '<div class="footer-col"><h4 data-i18n="footer.support">Get involved</h4><ul>' +
      '<li><a href="support.html" data-i18n="footer.donate">Support us</a></li>' +
      '<li><a href="support.html#data" data-i18n="footer.data">Data & API</a></li>' +
      '<li><a href="contact.html" data-i18n="footer.contact">Contact</a></li>' +
      '<li><a href="sources.html" data-i18n="footer.sources">Sources</a></li>' +
      "</ul></div></div>" +
      '<p class="footer-bottom" data-i18n="footer.copy">© 2026 Global Pulse · Unofficial, non-scientific. Results reflect anonymous visitor clicks only — not official ratings or election forecasts.</p>'
    );
  }

  function mountFooter() {
    document.querySelectorAll("[data-site-footer]").forEach((el) => {
      el.classList.add("site-footer");
      el.innerHTML = footerHtml();
    });
    if (window.GP_UI) {
      window.GP_UI.injectIconPlaceholders();
    }
  }

  window.GP_FOOTER = { mountFooter, footerHtml };
})();
