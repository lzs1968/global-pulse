function initHeader() {
  const header = document.querySelector(".site-header");
  if (!header) return;
  const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 24);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  const toggle = document.querySelector("[data-nav-toggle]");
  const nav = document.querySelector(".nav-links");
  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", nav.classList.contains("is-open"));
    });
  }
}

function initVoteButtons() {
  const group = document.querySelector("[data-vote-group]");
  if (!group || group.dataset.voteBound === "1") return;
  group.dataset.voteBound = "1";

  const leaderId =
    group.dataset.leaderId || new URLSearchParams(location.search).get("id");
  if (!leaderId) return;

  const buttons = group.querySelectorAll("[data-vote]");
  const note = group.closest(".glass-card")?.querySelector(".vote-note");

  function applyChoice(choice) {
    buttons.forEach((btn) => {
      btn.classList.toggle("is-selected", choice != null && btn.dataset.vote === choice);
    });
  }

  function applyVoteStats(result) {
    if (result.rate == null) return;
    const rateVal = result.rate;
    const oppose = (100 - rateVal).toFixed(1);
    const gaugeEl = document.querySelector("[data-gauge]");
    if (gaugeEl) gaugeEl.dataset.gauge = rateVal;
    const valueEl = document.querySelector("[data-gauge-value]");
    if (valueEl) valueEl.textContent = rateVal + "%";
    const opposeEl = document.querySelector(".gauge-meta .oppose");
    if (opposeEl) opposeEl.textContent = oppose + "%";
    if (result.total != null && window.GP_DATA) {
      const countEl = document.querySelector(".gauge-meta .tabular");
      if (countEl) countEl.textContent = window.GP_DATA.formatVotes(result.total);
    }
    const barS = document.querySelector(".sentiment-bar__support");
    const barO = document.querySelector(".sentiment-bar__oppose");
    if (barS) barS.style.width = rateVal + "%";
    if (barO) barO.style.width = 100 - rateVal + "%";
    const legS = document.querySelector(".sentiment-legend .support");
    const legO = document.querySelector(".sentiment-legend .oppose");
    if (legS) legS.textContent = "Support " + rateVal + "%";
    if (legO) legO.textContent = "Oppose " + oppose + "%";
    drawGauge();
  }

  function loadLocalChoice() {
    try {
      return localStorage.getItem("gp-vote-" + leaderId);
    } catch {
      return null;
    }
  }

  function saveLocalChoice(choice) {
    try {
      localStorage.setItem("gp-vote-" + leaderId, choice);
    } catch {
      /* ignore */
    }
  }

  async function hydrateChoice() {
    if (window.GP_VOTE) {
      const status = await window.GP_VOTE.getVote(leaderId);
      if (status.ok && status.choice) {
        applyChoice(status.choice);
        if (status.rate != null) applyVoteStats(status);
        return;
      }
      if (status.offline) {
        const saved = loadLocalChoice();
        if (saved) applyChoice(saved);
        if (note) {
          note.textContent =
            "Offline preview: votes are saved in this browser only. Use START.bat for IP-based limits.";
        }
        return;
      }
    }
    const saved = loadLocalChoice();
    if (saved) applyChoice(saved);
  }

  hydrateChoice();

  buttons.forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (btn.disabled) return;
      btn.classList.remove("is-ripple");
      void btn.offsetWidth;
      btn.classList.add("is-ripple");
      setTimeout(() => btn.classList.remove("is-ripple"), 650);
      const choice = btn.dataset.vote;
      const prevBtn = group.querySelector("[data-vote].is-selected");
      const prev = prevBtn ? prevBtn.dataset.vote : null;

      if (window.GP_VOTE) {
        buttons.forEach((b) => (b.disabled = true));
        const result = await window.GP_VOTE.submitVote(leaderId, choice);
        buttons.forEach((b) => (b.disabled = false));

        if (!result.ok) {
          showToast(result.error || "Vote failed. Please try again.");
          return;
        }

        applyChoice(result.choice);
        applyVoteStats(result);
        saveLocalChoice(result.choice);

        if (result.isNew) {
          showToast(choice === "support" ? "Recorded: support" : "Recorded: oppose");
        } else if (result.changed) {
          showToast(choice === "support" ? "Changed to: support" : "Changed to: oppose");
        } else {
          showToast("Your choice is confirmed");
        }
        return;
      }

      applyChoice(choice);
      saveLocalChoice(choice);
      if (prev && prev !== choice) {
        showToast(choice === "support" ? "Changed to: support" : "Changed to: oppose");
      } else {
        showToast(choice === "support" ? "Recorded: support" : "Recorded: oppose");
      }
    });
  });
}

function initTimeTabs() {
  document.querySelectorAll("[data-time-tabs]").forEach((wrap) => {
    const tabs = wrap.querySelectorAll("button");
    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        tabs.forEach((t) => t.classList.remove("is-active"));
        tab.classList.add("is-active");
        const target = tab.dataset.period;
        document.querySelectorAll("[data-period-panel]").forEach((panel) => {
          panel.hidden = panel.dataset.periodPanel !== target;
        });
      });
    });
  });
}

function initTimeTabsLeader() {
  const wrap = document.querySelector("[data-time-tabs]");
  if (!wrap || !window._leaderPeriods) return;
  const periods = window._leaderPeriods;
  const gaugeEl = document.querySelector("[data-gauge]");
  const valueEl = document.querySelector("[data-gauge-value]");
  const opposeEl = document.querySelector(".gauge-meta .oppose");

  wrap.querySelectorAll("button").forEach((tab) => {
    tab.addEventListener("click", () => {
      wrap.querySelectorAll("button").forEach((t) => t.classList.remove("is-active"));
      tab.classList.add("is-active");
      const p = tab.dataset.period;
      const val = periods[p];
      if (val == null) {
        if (valueEl) valueEl.textContent = "Verifying";
        return;
      }
      if (gaugeEl) {
        gaugeEl.dataset.gauge = val;
        drawGauge();
      }
      if (valueEl) valueEl.textContent = val + "%";
      if (opposeEl) opposeEl.textContent = (100 - val).toFixed(1) + "%";
      const labels = { "24h": "Last 24 hours", "7d": "Last 7 days", "30d": "Last 30 days", all: "All time" };
      const label = document.querySelector(".gauge-stats .stat-label");
      if (label) label.textContent = labels[p] + " approval";
      const barS = document.querySelector(".sentiment-bar__support");
      const barO = document.querySelector(".sentiment-bar__oppose");
      const legS = document.querySelector(".sentiment-legend .support");
      const legO = document.querySelector(".sentiment-legend .oppose");
      if (barS) barS.style.width = val + "%";
      if (barO) barO.style.width = 100 - val + "%";
      if (legS) legS.textContent = "Support " + val + "%";
      if (legO) legO.textContent = "Oppose " + (100 - val).toFixed(1) + "%";
    });
  });
}

function animateCounters() {
  document.querySelectorAll("[data-count]").forEach((el) => {
    const end = parseInt(el.dataset.count, 10);
    if (!end) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const node = entry.target;
          const duration = 1200;
          const start = performance.now();
          function tick(now) {
            const t = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - t, 3);
            node.textContent = Math.floor(end * eased).toLocaleString("en-US");
            if (t < 1) requestAnimationFrame(tick);
          }
          requestAnimationFrame(tick);
          io.unobserve(node);
        });
      },
      { threshold: 0.2 }
    );
    io.observe(el);
  });
}

function showToast(message) {
  let el = document.querySelector(".gp-toast");
  if (!el) {
    el = document.createElement("div");
    el.className = "gp-toast";
    el.setAttribute("role", "status");
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.classList.add("is-visible");
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => el.classList.remove("is-visible"), 2200);
}

function initScrollReveal() {
  const els = document.querySelectorAll(".reveal:not(.is-visible), .ed-fade:not(.is-visible)");
  if (!els.length) return;
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("is-visible");
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );
  els.forEach((el) => io.observe(el));
}

function drawSparklines() {
  document.querySelectorAll("[data-sparkline]").forEach((svg, idx) => {
    const values = svg.dataset.sparkline.split(",").map(Number);
    if (values.length < 2) return;
    const w = 100;
    const h = 32;
    const max = Math.max(...values);
    const min = Math.min(...values);
    const range = max - min || 1;
    const points = values
      .map((v, i) => {
        const x = (i / (values.length - 1)) * w;
        const y = h - ((v - min) / range) * (h - 4) - 2;
        return x + "," + y;
      })
      .join(" ");
    const isUp = values[values.length - 1] >= values[0];
    const color = isUp ? "#0f7a66" : "#c9453c";
    const gradId = "spark-grad-" + idx;
    svg.innerHTML =
      '<defs><linearGradient id="' +
      gradId +
      '" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="' +
      color +
      '" stop-opacity="0.35"/><stop offset="100%" stop-color="' +
      color +
      '" stop-opacity="0"/></linearGradient></defs>' +
      '<polygon fill="url(#' +
      gradId +
      ')" points="' +
      points +
      " " +
      w +
      ",32 0,32" +
      '" opacity="0.5"/>' +
      '<polyline fill="none" stroke="' +
      color +
      '" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" points="' +
      points +
      '" />';
  });
}

function drawGauge() {
  const ring = document.querySelector("[data-gauge]");
  if (!ring) return;
  const pct = parseFloat(ring.dataset.gauge) || 0;
  const r = 54;
  const c = 2 * Math.PI * r;
  const target = c * (1 - pct / 100);

  const styles = getComputedStyle(document.documentElement);
  const accent = (styles.getPropertyValue("--support").trim() || "#0d6b5a");
  const accent2 = "#12a088";
  const track = (styles.getPropertyValue("--line").trim() || "rgba(15,17,20,0.07)");
  const label = (styles.getPropertyValue("--muted").trim() || "#68707a");

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const startOffset = reduce ? target : c;

  ring.innerHTML =
    '<svg viewBox="0 0 120 120" class="gauge-ring" role="img" aria-label="Approval ' + pct + '%">' +
    '<defs><linearGradient id="gauge-grad" x1="0" y1="0" x2="1" y2="1">' +
    '<stop offset="0%" stop-color="' + accent + '"/>' +
    '<stop offset="100%" stop-color="' + accent2 + '"/></linearGradient></defs>' +
    '<circle cx="60" cy="60" r="' + r + '" fill="none" stroke="' + track + '" stroke-width="9"/>' +
    '<circle class="gauge-progress" cx="60" cy="60" r="' + r +
    '" fill="none" stroke="url(#gauge-grad)" stroke-width="9" stroke-dasharray="' + c +
    '" stroke-dashoffset="' + startOffset +
    '" stroke-linecap="round" transform="rotate(-90 60 60)"/>' +
    '<text x="60" y="58" text-anchor="middle" font-size="22" font-weight="600" fill="' + accent + '">' +
    pct + '%</text>' +
    '<text x="60" y="75" text-anchor="middle" font-size="9" letter-spacing="0.5" fill="' + label + '">Approval</text></svg>';

  if (!reduce) {
    const arc = ring.querySelector(".gauge-progress");
    if (arc) requestAnimationFrame(() => { arc.style.strokeDashoffset = target; });
  }
}

function drawTrendChart(data) {
  const canvas = document.getElementById("trend-chart");
  if (!canvas) return;
  const series = data || window._leaderTrendData || [52, 54, 53, 56, 58, 57, 59, 61, 60, 62, 63, 62];
  const ctx = canvas.getContext("2d");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const rect = canvas.getBoundingClientRect();
  if (rect.width < 10) return;
  canvas.width = rect.width * dpr;
  canvas.height = (rect.height || 200) * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const w = rect.width;
  const h = rect.height || 200;
  const pad = 12;
  const max = Math.max(...series) + 4;
  const min = Math.min(...series) - 4;
  ctx.clearRect(0, 0, w, h);
  ctx.strokeStyle = "rgba(21,23,26,0.06)";
  for (let i = 0; i <= 4; i++) {
    const y = pad + ((h - pad * 2) * i) / 4;
    ctx.beginPath();
    ctx.moveTo(pad, y);
    ctx.lineTo(w - pad, y);
    ctx.stroke();
  }
  const pts = series.map((v, i) => ({
    x: pad + ((w - pad * 2) * i) / (series.length - 1),
    y: pad + (h - pad * 2) * (1 - (v - min) / (max - min)),
  }));
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, "rgba(15, 122, 102, 0.2)");
  grad.addColorStop(1, "transparent");
  ctx.beginPath();
  ctx.moveTo(pts[0].x, h);
  pts.forEach((p) => ctx.lineTo(p.x, p.y));
  ctx.lineTo(pts[pts.length - 1].x, h);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.beginPath();
  pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
  const accent = getComputedStyle(document.documentElement).getPropertyValue("--support").trim() || "#0d6b5a";
  ctx.strokeStyle = accent;
  ctx.lineWidth = 2.25;
  ctx.stroke();

  ctx.fillStyle = accent;
  pts.forEach((p) => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
    ctx.fill();
  });
}

window.GP_APP = {
  initHeader,
  initVoteButtons,
  initTimeTabs,
  initTimeTabsLeader,
  animateCounters,
  drawSparklines,
  drawGauge,
  drawTrendChart,
  initScrollReveal,
  showToast,
};

document.addEventListener("DOMContentLoaded", async function () {
  document.body.classList.add("is-ready");
  if (window.GP_UI) {
    window.GP_UI.applyAvatars();
    window.GP_UI.injectIconPlaceholders();
  }

  initHeader();
  initVoteButtons();
  initTimeTabs();
  animateCounters();
  drawSparklines();
  drawGauge();
  drawTrendChart();

  if (window.GP_PAGES) {
    window.GP_PAGES.initSearchForm();
    window.GP_PAGES.initHomeList();
    window.GP_PAGES.initRankingsPage();
    window.GP_PAGES.initLeaderPage();
    window.GP_PAGES.initLeadersExplore();
    window.GP_PAGES.initTimelinePage();
  }

  initScrollReveal();

  if (window.GP_MAP) {
    const heroMap = document.getElementById("world-map");
    if (heroMap) {
      await window.GP_MAP.initWorldMap(heroMap, { mode: "hero" });
      window.GP_MAP.initMapLegend();
    }

    const fullMap = document.getElementById("world-map-full");
    if (fullMap) {
      const result = await window.GP_MAP.initWorldMap(fullMap, { mode: "full" });
      window.GP_MAP.initMapLegend();
      window.GP_MAP.initMapSidebar(result.map, result.countryLayer);
    }
  }
});

window.addEventListener("resize", () => drawTrendChart());
