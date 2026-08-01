/* =====================================================================
   scores.js — fetches public fixtures/results from TheSportsDB and
   renders score cards. This is SCORE DATA ONLY (no video/streams).

   TheSportsDB: https://www.thesportsdb.com/api/
   - Free/test API key is "123". For production, get your own key and
     replace API_KEY below (their Patreon unlocks higher rate limits and
     the "next/past events" endpoints).
   ===================================================================== */

(function () {
  "use strict";

  var API_KEY = "123"; // <-- replace with your own TheSportsDB key
  var BASE = "https://www.thesportsdb.com/api/v1/json/" + API_KEY;

  // A few popular leagues (TheSportsDB league IDs).
  var LEAGUES = [
    { id: 4328, label: "Premier League", icon: "⚽" },
    { id: 4387, label: "NBA", icon: "🏀" },
    { id: 4391, label: "NFL", icon: "🏈" }
  ];

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function scoreLine(ev) {
    var home = esc(ev.strHomeTeam || "Home");
    var away = esc(ev.strAwayTeam || "Away");
    var hs = ev.intHomeScore, as = ev.intAwayScore;
    var hasScore = hs !== null && hs !== "" && as !== null && as !== "";
    var right = hasScore ? esc(hs) + " – " + esc(as) : esc(ev.dateEvent || "TBD");
    return (
      '<div style="display:flex;justify-content:space-between;gap:12px;' +
      'padding:10px 0;border-bottom:1px solid var(--border)">' +
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
        var note = el("p", null,
          'Scores via TheSportsDB (public data). Using the free test key — ' +
          '<a href="https://www.thesportsdb.com/api.php" target="_blank" rel="noopener">get your own key</a> for production.');
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
