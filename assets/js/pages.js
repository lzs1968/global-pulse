/** Page-specific rendering */
(function () {
  const { LEADERS_DB, RANK_TABS, getLeaderById, leaderUrl, formatVotes } = window.GP_DATA;

  function renderLeaderRow(leader, rank, tabKey) {
    const rankCls = rank <= 3 ? "rank-num--top" : "";
    const tag = leader.historical
      ? '<span class="tag tag--history">Historical</span>'
      : '<span class="tag tag--current">Current</span>';
    const displayRate = tabKey === "oppose" && leader.rate != null ? 100 - leader.rate : leader.rate;
    const rateCls = displayRate >= 50 ? "rate-value--support" : "rate-value--oppose";
    const rateText = leader.frozen || leader.rate == null ? "—" : displayRate.toFixed(1) + "%";
    const disabled = leader.frozen || leader.votes < 300 ? ' style="opacity:0.65"' : "";
    const href = leader.frozen ? "#" : leaderUrl(leader.id);
    const spark = (leader.sparkline || []).join(",");

    return (
      '<a class="leader-row" href="' +
      href +
      '"' +
      disabled +
      ">" +
      '<span class="rank-num ' +
      rankCls +
      ' tabular">' +
      (rank < 10 ? "0" + rank : rank) +
      "</span>" +
      '<img class="leader-avatar" data-avatar="' +
      leader.seed +
      '" alt="" width="48" height="48" />' +
      '<div class="leader-info"><h3>' +
      leader.name +
      " " +
      tag +
      "</h3><p class=\"meta\">" +
      leader.country +
      " · " +
      leader.role +
      "</p></div>" +
      '<svg class="sparkline" data-sparkline="' +
      spark +
      '" viewBox="0 0 100 32"></svg>' +
      '<div class="rate-block"><div class="rate-value ' +
      rateCls +
      ' tabular">' +
      rateText +
      '</div><div class="rate-votes tabular">' +
      formatVotes(leader.votes) +
      " votes</div></div></a>"
    );
  }

  function sortLeaders(list, tabKey) {
    const copy = list.slice();
    if (tabKey === "oppose") {
      copy.sort((a, b) => a.rate - b.rate);
      return copy;
    }
    if (tabKey === "hot") {
      copy.sort((a, b) => b.votes * 0.1 - a.votes * 0.1);
      return copy;
    }
    copy.sort((a, b) => (b.rate || 0) - (a.rate || 0));
    return copy;
  }

  function initRankingsPage() {
    const grid = document.querySelector("[data-rankings-grid]");
    const tabs = document.querySelector("[data-rank-tabs]");
    if (!grid || !tabs) return;

    const params = new URLSearchParams(location.search);
    let tabKey = params.get("tab") || params.get("sort") || params.get("type") || "support";
    if (params.get("type") === "history") tabKey = "history";
    if (params.get("type") === "current") tabKey = "support";
    if (params.get("sort") === "hot") tabKey = "hot";
    if (params.get("sort") === "controversy") tabKey = "controversy";
    if (!RANK_TABS[tabKey]) tabKey = "support";

    function render() {
      const tab = RANK_TABS[tabKey];
      let list = LEADERS_DB.filter(tab.filter);
      list = sortLeaders(list, tabKey);

      const title = document.querySelector("[data-rank-title]");
      if (title) title.textContent = tab.label;

      if (list.length === 0) {
        grid.innerHTML =
          '<p class="empty-state">No leaders match this board yet.</p>';
      } else {
        grid.innerHTML = list
          .map((l, i) => {
            const row = renderLeaderRow(l, i + 1, tabKey);
            return row.replace("leader-row", 'leader-row style="animation-delay:' + i * 0.05 + 's"');
          })
          .join("");
      }

      tabs.querySelectorAll("a").forEach((a) => {
        a.classList.toggle("is-active", a.dataset.tab === tabKey);
        a.href = "rankings.html?tab=" + a.dataset.tab;
      });

      window.GP_UI.applyAvatars();
      if (window.GP_APP) {
        if (window.GP_APP.drawSparklines) window.GP_APP.drawSparklines();
        window.GP_APP.initScrollReveal();
      }
    }

    render();
  }

  function getRelatedLeaders(leader, limit) {
    const max = limit || 4;
    return LEADERS_DB.filter((l) => l.id !== leader.id && !l.frozen)
      .map((l) => {
        let score = 0;
        if (l.country === leader.country) score += 4;
        if (l.region === leader.region) score += 2;
        if (l.historical === leader.historical) score += 1;
        return { leader: l, score };
      })
      .sort((a, b) => b.score - a.score || (b.leader.rate || 0) - (a.leader.rate || 0))
      .slice(0, max)
      .map((x) => x.leader);
  }

  function renderRelatedLeaders(leader) {
    const related = getRelatedLeaders(leader);
    if (!related.length) return "";
    return (
      '<article class="glass-card related-leaders"><h2>Related leaders</h2><div class="related-grid">' +
      related
        .map(
          (r) =>
            '<a class="related-card" href="' +
            leaderUrl(r.id) +
            '"><img data-avatar="' +
            r.seed +
            '" width="48" height="48" alt="" /><div><strong>' +
            r.name +
            "</strong><span>" +
            r.country +
            " · " +
            (r.frozen ? "Verifying" : r.rate + "%") +
            "</span></div></a>"
        )
        .join("") +
      "</div></article>"
    );
  }

  function leaderSkeleton() {
    return (
      '<div class="skeleton-layout detail-layout" style="display:contents">' +
      '<aside class="profile-card"><div class="skeleton-block skeleton-avatar"></div>' +
      '<div class="skeleton-block skeleton-line skeleton-line--title"></div>' +
      '<div class="skeleton-block skeleton-line"></div><div class="skeleton-block skeleton-line skeleton-line--short"></div></aside>' +
      '<div class="data-panel"><div class="glass-card"><div class="skeleton-block skeleton-line"></div>' +
      '<div class="skeleton-block skeleton-line" style="height:120px;margin-top:16px"></div></div></div>' +
      '<aside class="vote-panel"><div class="glass-card"><div class="skeleton-block skeleton-line" style="height:48px"></div></div></aside></div>'
    );
  }

  function initLeaderPage() {
    const root = document.querySelector("[data-leader-page]");
    if (!root) return;

    root.innerHTML = leaderSkeleton();

    const id = new URLSearchParams(location.search).get("id") || "merkel";

    function render() {
    const L = getLeaderById(id);
    const rateVal = L.periods["30d"] ?? L.rate ?? 50;
    const oppose = L.rate != null ? (100 - rateVal).toFixed(1) : "—";
    const supportW = L.frozen ? 50 : rateVal;

    document.title = L.name + " · Global Pulse";

    root.innerHTML =
      '<aside class="profile-card">' +
      '<img class="avatar-lg" data-avatar="' +
      L.seed +
      '" data-avatar-size="320" alt="' +
      L.name +
      '" />' +
      "<h1>" +
      L.name +
      "</h1>" +
      '<p class="profile-role">' +
      L.country +
      " · " +
      L.role +
      "（" +
      L.term +
      "）" +
      "</p>" +
      '<div class="profile-tags">' +
      (L.historical
        ? '<span class="tag tag--history">Historical</span>'
        : '<span class="tag tag--current">Current</span>') +
      '<span class="tag tag--current">' +
      L.region +
      "</span>" +
      (L.frozen ? '<span class="tag">Under review</span>' : "") +
      "</div>" +
      '<p class="profile-bio">' +
      L.bio +
      "</p></aside>" +
      '<div class="data-panel">' +
      '<article class="glass-card"><div data-time-tabs class="time-tabs">' +
      '<button type="button" data-period="24h">24h</button>' +
      '<button type="button" data-period="7d">7d</button>' +
      '<button type="button" class="is-active" data-period="30d">30d</button>' +
      '<button type="button" data-period="all">All</button></div>' +
      '<div class="gauge-wrap"><div data-gauge="' +
      (L.periods["30d"] || L.rate || 0) +
      '" data-gauge-period="30d"></div>' +
      '<div class="gauge-stats" data-gauge-stats>' +
      '<p class="stat-label">30-day approval</p>' +
      '<p class="gauge-main tabular" data-gauge-value>' +
      (L.frozen ? "Verifying" : (L.periods["30d"] || L.rate) + "%") +
      "</p>" +
      '<p class="gauge-meta">Valid votes <span class="tabular">' +
      formatVotes(L.votes) +
      '</span> · Oppose <span class="tabular oppose">' +
      oppose +
      "%</span></p>" +
      '<div class="sentiment-bar" aria-hidden="true"><div class="sentiment-bar__support" style="width:' +
      supportW +
      '%"></div><div class="sentiment-bar__oppose" style="width:' +
      (100 - supportW) +
      '%"></div></div>' +
      '<div class="sentiment-legend"><span class="support">Support ' +
      (L.frozen ? "—" : rateVal + "%") +
      '</span><span class="oppose">Oppose ' +
      oppose +
      '%</span></div>' +
      '<p class="gauge-disclaimer">Non-scientific sample from this site only.</p></div></div></article>' +
      '<article class="glass-card"><h2>Approval trend</h2><div class="chart-frame">' +
      '<span class="chart-frame__label">Last 12 months</span>' +
      '<canvas id="trend-chart" class="chart-area"></canvas></div></article>' +
      '<article class="glass-card"><h2>Key timeline</h2><ul class="timeline" data-timeline>' +
      (L.timeline.length
        ? L.timeline
            .map(
              (t) =>
                "<li><time>" +
                t.year +
                "</time><p>" +
                t.text +
                "</p></li>"
            )
            .join("")
        : "<li><p>No public timeline entries yet.</p></li>") +
      '</ul><p class="sources-link"><a href="sources.html">Sources & revision history →</a></p></article>' +
      renderRelatedLeaders(L) +
      "</div>" +
      '<aside class="vote-panel"><div class="glass-card">' +
      '<h2 class="vote-title">Your anonymous vote</h2>' +
      '<div class="vote-actions" data-vote-group data-leader-id="' +
      L.id +
      '">' +
      '<button type="button" class="btn btn-vote btn-support" data-vote="support" ' +
      (L.frozen ? "disabled" : "") +
      '><span data-icon="thumbUp"></span> Support <span class="vote-status">· recorded</span></button>' +
      '<button type="button" class="btn btn-vote btn-oppose" data-vote="oppose" ' +
      (L.frozen ? "disabled" : "") +
      '><span data-icon="thumbDown"></span> Oppose <span class="vote-status">· recorded</span></button>' +
      "</div>" +
      '<p class="vote-note">One vote per leader per IP. You can change your choice anytime — the latest counts.</p></div>' +
      '<div class="ad-frame ad-frame--sidebar"><div data-ad-slot></div></div></aside>';

    const crumb = document.querySelector("[data-leader-crumb]");
    if (crumb) crumb.textContent = L.name;

    window.GP_UI.applyAvatars();
    window.GP_UI.injectIconPlaceholders();

    window._leaderTrendData = L.trendData;
    window._leaderPeriods = L.periods;

    if (window.GP_APP) {
      window.GP_APP.initVoteButtons();
      window.GP_APP.initTimeTabsLeader();
      window.GP_APP.drawGauge();
      window.GP_APP.drawTrendChart(L.trendData);
      window.GP_APP.initScrollReveal();
    }
    if (window.GP_ADS) window.GP_ADS.render();
    }

    setTimeout(render, 120);
  }

  function initLeadersExplore() {
    const grid = document.querySelector("[data-leaders-grid]");
    const search = document.querySelector("[data-leaders-search]");
    const filters = document.querySelector("[data-explore-filters]");
    if (!grid) return;

    let chipFilter = "all";
    const params = new URLSearchParams(location.search);
    if (params.get("type") === "history") chipFilter = "history";
    if (params.get("type") === "current") chipFilter = "current";

    function applyChipFilter(list) {
      if (chipFilter === "current") return list.filter((l) => !l.historical);
      if (chipFilter === "history") return list.filter((l) => l.historical);
      if (chipFilter === "hot") return list.filter((l) => l.hot);
      if (chipFilter === "controversy") return list.filter((l) => l.controversy);
      return list;
    }

    function render(filter) {
      const q = (filter || "").trim().toLowerCase();
      let list = applyChipFilter(LEADERS_DB.slice());
      if (q) {
        list = list.filter(
          (l) =>
            l.name.toLowerCase().includes(q) ||
            l.country.includes(q) ||
            l.role.includes(q) ||
            (l.region && l.region.includes(q))
        );
      }
      if (filters) {
        filters.querySelectorAll("[data-filter]").forEach((btn) => {
          btn.classList.toggle("is-active", btn.dataset.filter === chipFilter);
        });
      }
      grid.innerHTML = list
        .map(
          (l) =>
            '<a class="leader-card" href="' +
            leaderUrl(l.id) +
            '">' +
            '<img data-avatar="' +
            l.seed +
            '" width="64" height="64" alt="" />' +
            "<h3>" +
            l.name +
            "</h3>" +
            "<p>" +
            l.country +
            " · " +
            l.role +
            "</p>" +
            '<span class="leader-card-rate">' +
            (l.frozen ? "Verifying" : l.rate + "% approval") +
            "</span></a>"
        )
        .join("");
      window.GP_UI.applyAvatars();
    }

    if (filters) {
      filters.querySelectorAll("[data-filter]").forEach((btn) => {
        btn.addEventListener("click", () => {
          chipFilter = btn.dataset.filter || "all";
          render(search ? search.value : "");
        });
      });
    }

    render(search ? search.value : "");
    if (search) {
      search.addEventListener("input", () => render(search.value));
    }
  }

  function initHomeList() {
    const grid = document.querySelector("[data-home-leaders]");
    if (!grid) return;
    const top = LEADERS_DB.filter((l) => l.rate != null && !l.frozen)
      .sort((a, b) => b.rate - a.rate)
      .slice(0, 5);
    grid.innerHTML = top
      .map((l, i) => {
        const row = renderLeaderRow(l, i + 1, "support");
        return row.replace("leader-row", 'leader-row style="animation-delay:' + i * 0.05 + 's"');
      })
      .join("");
    window.GP_UI.applyAvatars();
    if (window.GP_APP) window.GP_APP.drawSparklines();
  }

  function initSearchForm() {
    document.querySelectorAll('form[role="search"]').forEach((form) => {
      form.addEventListener("submit", (e) => {
        const input = form.querySelector('input[name="q"], input[type="search"]');
        const q = input ? input.value.trim() : "";
        if (!q) return;
        e.preventDefault();
        location.href = "leaders.html?q=" + encodeURIComponent(q);
      });
    });
    const params = new URLSearchParams(location.search);
    const q = params.get("q");
    const search = document.querySelector("[data-leaders-search]");
    if (q && search) search.value = q;
  }

  function initTimelinePage() {
    const wrap = document.querySelector("[data-timeline-page]");
    if (!wrap) return;
    const events = [];
    LEADERS_DB.forEach((l) => {
      (l.timeline || []).forEach((t) => {
        events.push({ year: parseInt(t.year, 10), leader: l.name, id: l.id, text: t.text });
      });
    });
    events.sort((a, b) => b.year - a.year);
    wrap.innerHTML =
      '<ul class="timeline timeline--global">' +
      events
        .map(
          (e) =>
            "<li><time>" +
            e.year +
            '</time><p><a href="' +
            leaderUrl(e.id) +
            '">' +
            e.leader +
            "</a> — " +
            e.text +
            "</p></li>"
        )
        .join("") +
      "</ul>";
  }

  window.GP_PAGES = {
    initRankingsPage,
    initLeaderPage,
    initLeadersExplore,
    initHomeList,
    initSearchForm,
    initTimelinePage,
  };
})();
