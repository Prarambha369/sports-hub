/* ====================================================================
   scores.js: latest result and next fixture for popular leagues, from
   TheSportsDB's public API (https://www.thesportsdb.com/api.php).

   The free key returns one event per call, so each league card shows its
   most recent result and its next scheduled match. Get your own key for
   higher limits and fuller lists.
   ==================================================================== */

(function () {
  "use strict";

  var API_KEY = "123"; // free public key; replace with your own for production
  var BASE = "https://www.thesportsdb.com/api/v1/json/" + API_KEY;

  var LEAGUES = [
    { id: 4328, label: "Premier League", icon: "⚽" },
    { id: 4335, label: "La Liga", icon: "⚽" },
    { id: 4387, label: "NBA", icon: "🏀" },
    { id: 4391, label: "NFL", icon: "🏈" },
    { id: 4380, label: "NHL", icon: "🏒" },
    { id: 4424, label: "MLB", icon: "⚾" }
  ];

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function get(path, leagueId) {
    return fetch(BASE + path)
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        // Only keep events from the requested league (the API occasionally mixes them).
        return ((d && d.events) || []).filter(function (ev) { return String(ev.idLeague) === String(leagueId); });
      })
      .catch(function () { return []; });
  }

  function hasScore(ev) {
    return ev.intHomeScore !== null && ev.intHomeScore !== "" && ev.intAwayScore !== null && ev.intAwayScore !== "";
  }

  function when(ev) {
    var iso = ev.strTimestamp ? ev.strTimestamp + (/[zZ+]/.test(ev.strTimestamp.slice(10)) ? "" : "Z") : null;
    var d = iso ? new Date(iso) : null;
    if (d && !isNaN(d)) {
      return d.toLocaleString([], { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    }
    return ev.dateEvent || "TBD";
  }

  function row(label, ev) {
    if (!ev) return "";
    var right = hasScore(ev) ? esc(ev.intHomeScore) + " – " + esc(ev.intAwayScore) : esc(when(ev));
    return (
      '<div class="fixture">' +
        '<span class="fixture-label">' + label + "</span>" +
        '<span class="fixture-teams">' + esc(ev.strHomeTeam || "Home") + ' <span class="muted">v</span> ' + esc(ev.strAwayTeam || "Away") + "</span>" +
        '<strong class="fixture-right">' + right + "</strong>" +
      "</div>"
    );
  }

  function card(league, last, next) {
    var body = row("Latest", last[0]) + row("Next", next[0]);
    return (
      '<article class="card league-card">' +
        "<h3>" + league.icon + " " + esc(league.label) + "</h3>" +
        (body || '<p class="muted">No fixtures available right now.</p>') +
      "</article>"
    );
  }

  function mount() {
    var host = document.getElementById("scores-widget");
    if (!host) return;
    host.innerHTML = '<p class="muted center">Loading fixtures…</p>';

    Promise.all(LEAGUES.map(function (l) {
      return Promise.all([get("/eventspastleague.php?id=" + l.id, l.id), get("/eventsnextleague.php?id=" + l.id, l.id)]);
    }))
      .then(function (results) {
        host.innerHTML =
          '<div class="league-grid">' +
          LEAGUES.map(function (l, i) { return card(l, results[i][0], results[i][1]); }).join("") +
          "</div>" +
          '<p class="source-note">Fixtures and results from <a href="https://www.thesportsdb.com" target="_blank" rel="noopener">TheSportsDB</a>. Times shown in your local time zone.</p>';
      })
      .catch(function () {
        host.innerHTML = '<p class="muted center">Couldn\'t load fixtures right now. Try again later.</p>';
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})();
