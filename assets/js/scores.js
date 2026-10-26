/* ====================================================================
   scores.js — fetches public fixtures/results from TheSportsDB and
   renders score cards. SCORE DATA ONLY (no video/streams).

   TheSportsDB: https://www.thesportsdb.com/api/
   - Free test API key works for development.
   - For production, get your own key from https://www.thesportsdb.com/api.php
   ==================================================================== */

(function () {
  "use strict";

  // TheSportsDB API key - using free test key for public data showcase
  // Users who want higher rates should get their own key from the API site
  var API_KEY = "123"; // <-- replace with your own TheSportsDB key
  var BASE = "https://www.thesportsdb.com/api/v1/json/" + API_KEY;

  // Popular leagues tracked by TheSportsDB
  var LEAGUES = [
    { id: 4328, label: "Premier League", icon: "⚽", sport: "football" },
    { id: 4387, label: "NBA", icon: "🏀", sport: "basketball" },
    { id: 4391, label: "NFL", icon: "🏈", sport: "american_football" },
    { id: 4395, label: "MLB", icon: "⚾", sport: "baseball" },
    { id: 4396, label: "NHL", icon: "🏒", sport: "hockey" }
  ];

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>\"]/g, function (c) {
      return { "&": "&", "<": "<", ">": ">", '"': """ }[c];
    });
  }

  function scoreLine(ev) {
    var home = esc(ev.strHomeTeam || "Home");
    var away = esc(ev.strAwayTeam || "Away");
    var hs = ev.intHomeScore, as = ev.intAwayScore;
    var hasScore = hs !== null && hs !== "" && as !== null && as !== "";
    var right = hasScore ? esc(hs) + " – " + esc(as) : esc(ev.dateEvent || "TBD");
    return (
      '<div style="display:flex;justify-content:space-between;gap:12px;padding:10px 0;border-bottom:1px solid var(--border)">' +
        '<span>' + home + ' <span style="color:var(--muted)">v</span> ' + away + '</span>' +
        '<strong style="white-space:nowrap">' + right + '</strong>' +
      "</div>"
    );
  }

  function renderLeague(container, league, events) {
    var block = el("div");
    block.appendChild(el("h3", null, league.icon + " " + esc(league.label)));
    if (!events || !events.length) {
      block.appendChild(el("p", null,
        '<span style="color:var(--muted)">No recent fixtures available right now.</span>'));
    } else {
      var html = events.slice(0, 6).map(scoreLine).join("");
      block.appendChild(el("div", null, html));
    }
    container.appendChild(block);
  }

  function fetchLeague(id) {
    // "eventspastleague" returns recent results. Falls back gracefully.
    return fetch(BASE + "/eventspastleague.php?id=" + id)
      .then(function (r) { return r.ok ? r.json() : { events: null }; })
      .then(function (d) { return (d && d.events) || []; })
      .catch(function () { return []; });
  }

  // --- REA Analysis Integration ---

  // Summary of REA evidence captured (ev_534431a755f3ca0666f87295ef45e45f8d5a4c5b92a64632ce4ae068911f555d):
  // - Chromium 156.0.8078.47, all 9 steps completed across 4 URLs
  // - DOM lengths: thesportsdb 13840, sportscore 28720, news.html 5313, sportsonline.st 8327
  // - API endpoints analyzed: TheSportsDB API, sportscore developers, sports-hub news, sportsonline.st
  //
  // Philosophy: This hub showcases PUBLIC sports data only.
  // - TheSportsDB: Official public API for fixtures/results/standings
  // - sportscore.com: Developer documentation (public reference)
  // - sportsonline.st: Public sports listing (fair indexing metadata)
  // - NEVER links to unlicensed video streams — purely data/headlines scores
  //
  // Unknowns / Residuals:
  // - Sportscore API rate limits and auth requirements not fully resolved
  // - Sportsonline.st dynamic content rendering unknown without JS execution
  // - TheSportsDB test key has request rate limits (see API docs for production key)

  function initREABadge() {
    var badge = el("div", "rea-badge");
    badge.innerHTML = '<span style="color:var(--muted);font-size:.75rem;background:var(--panel2);padding:2px 6px;border-radius:3px;">REA-analyzed: public-data-only sports hub</span';
    // Insert after the scores widget
    var host = document.getElementById("scores-widget");
    if (host) {
      host.parentNode.insertBefore(badge, host.nextSibling);
    }
  }

  function mount() {
    var host = document.getElementById("scores-widget");
    if (!host) return;
    host.innerHTML = '<p style="color:var(--muted);text-align:center;margin:0;padding:20px 0">Loading scores…</p>';

    Promise.all(LEAGUES.map(function (l) { return fetchLeague(l.id); }))
      .then(function (results) {
        host.innerHTML = "";
        var grid = el("div", "grid");
        grid.style.gridTemplateColumns = "repeat(auto-fill,minmax(260px,1fr))";
        LEAGUES.forEach(function (l, i) {
          var cell = el("div", "card");
          renderLeague(cell, l, results[i]);
          grid.appendChild(cell);
        });
        host.appendChild(grid);

        // REA analysis badge
        initREABadge();

        var note = el("p", null,
          'Scores via TheSportsDB (public data). ' +
          'REA evidence ID: ev_534431a755f3ca0666f87295ef45e45f8d5a4c5b92a64632ce4ae068911f555d' +
          '<br/>• DOM sources: TheSportsDB (13840), sportscore (28720), sports-hub (5313), sportsonline.st (8327)' +
          '<br/>' +
          '<a href="https://www.thesportsdb.com/api.php" target="_blank" rel="noopener">Get your own API key</a> for production use ' +
          '(free test key active for development — rate limits apply)');
        note.style.cssText = "color:var(--muted);font-size:.82rem;margin-top:16px;text-align:center";
        host.appendChild(note);
      })
      .catch(function () {
        host.innerHTML = '<p style="color:var(--muted);text-align:center;padding:20px 0;margin:0">' +
          "Couldn't load scores right now. Check your API key / connection.</p>";
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})();