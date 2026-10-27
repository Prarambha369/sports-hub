/* =====================================================================
   integrations.js — sportsonline.st + kokasports.com fetch/display
   Shared by index.html and news.html. 6-hour localStorage cache.
   ===================================================================== */
(function () {
  "use strict";

  var SPORTSONLINE_KEY = "sh:sportsonline:matches";
  var SPORTSONLINE_TIME = "sh:sportsonline:fetch";
  var KOKA_KEY = "sh:kokasports:fixtures";
  var KOKA_TIME = "sh:kokasports:fetch";
  var SIX_HOURS = 21600000;

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function iconFor(text) {
    var sportIcons = { football: "⚽", soccer: "⚽", cricket: "🏏", nba: "🏀", nfl: "🏈",
      tennis: "🎾", ufc: "🥊", rugby: "🏉", golf: "⛳", boxing: "🥋", hockey: "🏒" };
    var key = ((text || "").match(/\b(football|soccer|cricket|nba|nfl|tennis|ufc|rugby|golf|boxing|hockey)\b/i) || [""])[1];
    key = key ? key.toLowerCase() : "";
    return sportIcons[key] || "⚽";
  }

  function fetchSportsonline(force) {
    var last = localStorage.getItem(SPORTSONLINE_TIME);
    var now = Date.now();
    if (!force && last && now - +last < SIX_HOURS) {
      try { return Promise.resolve(JSON.parse(localStorage.getItem(SPORTSONLINE_KEY) || "[]")); }
      catch (e) { return Promise.resolve([]); }
    }
    return fetch("https://sportsonline.st").then(function (r) { return r.text(); }).then(function (text) {
      var matches = [];
      var lines = text.split("\n");
      for (var i = 0; i < lines.length; i++) {
        var m = lines[i].match(/^\s*([0-9:]+)\s+(.+)\|\s*(https?:\/\/.+)$/);
        if (m) matches.push({ time: m[1], teams: m[2].trim(), url: m[3].trim() });
      }
      if (matches.length) {
        localStorage.setItem(SPORTSONLINE_KEY, JSON.stringify(matches));
        localStorage.setItem(SPORTSONLINE_TIME, String(Date.now()));
      }
      return matches;
    }).catch(function () { return []; });
  }

  function fetchKokasports(force) {
    var last = localStorage.getItem(KOKA_TIME);
    var now = Date.now();
    if (!force && last && now - +last < SIX_HOURS) {
      try { return Promise.resolve(JSON.parse(localStorage.getItem(KOKA_KEY) || "[]")); }
      catch (e) { return Promise.resolve([]); }
    }
    return fetch("https://www.kokasports.com/").then(function (r) { return r.text(); }).then(function (text) {
      var fixtures = [];
      var onTv = text.match(/On TV Today[\s\S]{0,3000}/);
      if (onTv) {
        var lines = onTv[0].split("\n");
        for (var i = 0; i < lines.length; i++) {
          var m = lines[i].match(/(\w+day\s\d+\s\w+)\n([^<>]+)\n([^<>]+)/i);
          if (m) {
            fixtures.push({ dateTime: m[1].trim(), competition: m[2].trim(),
              broadcaster: (m[3] || "").replace(/[()]/g, "").trim() || "-" });
          }
        }
      }
      if (fixtures.length) {
        localStorage.setItem(KOKA_KEY, JSON.stringify(fixtures.slice(0, 8)));
        localStorage.setItem(KOKA_TIME, String(Date.now()));
      }
      return fixtures.slice(0, 8);
    }).catch(function () { return []; });
  }

  function renderSportsonline(grid, timeEl) {
    if (!grid) return;
    fetchSportsonline().then(function (matches) {
      var html = matches.map(function (m) {
        var time = m.time || "-";
        var teams = m.teams || "-";
        var url = m.url || "#";
        var icon = iconFor(teams);
        var teamPair = teams.split("|").map(function (t) { return t.trim(); }).filter(Boolean)[0] || teams;
        return '<div class="match-card"><div class="match-info"><span class="match-icon">' + icon +
          '</span><span class="match-details"><strong>' + esc(teamPair) + '</strong><small>' + esc(time) +
          '</small></span></div><button class="match-play-btn" data-play-url="' + esc(url) + '">Play</button></div>';
      }).join("");
      grid.innerHTML = html || '<p style="color:var(--muted)">No matches available right now.</p>';
      if (timeEl) {
        var t = localStorage.getItem(SPORTSONLINE_TIME);
        timeEl.innerText = t ? new Date(+t).toLocaleTimeString() : "never fetched";
      }
    });
  }

  function renderKokasports(grid, timeEl) {
    if (!grid) return;
    fetchKokasports().then(function (fixtures) {
      var html = fixtures.map(function (f) {
        var competition = f.competition || "-";
        var broadcaster = f.broadcaster || "-";
        var icon = iconFor(competition);
        return '<div style="margin-top:12px;"><div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">' +
          '<span style="font-size:1.2rem;">' + icon + '</span><span style="font-weight:600;color:var(--text);font-size:0.9rem;">' +
          esc(competition) + '</span></div><div style="font-size:.8rem;color:var(--muted);">Broadcast: ' + esc(broadcaster) + '</div></div>';
      }).join("");
      grid.innerHTML = html || '<p style="color:var(--muted)">No fixtures available right now.</p>';
      if (timeEl) {
        var t = localStorage.getItem(KOKA_TIME);
        timeEl.innerText = t ? new Date(+t).toLocaleTimeString() : "never fetched";
      }
    });
  }

  function init() {
    // index.html containers
    renderSportsonline(document.querySelector(".sportsonline-match-grid"),
      document.getElementById("sportsonline-fetch-time-home"));
    renderKokasports(document.querySelector(".kokasports-match-grid"),
      document.getElementById("kokasports-fetch-time-home"));
    // news.html containers
    renderSportsonline(document.querySelector(".sportsonline-integration .match-grid"),
      document.getElementById("sportsonline-fetch-time"));
    renderKokasports(document.querySelector(".kokasports-integration .match-grid"),
      document.getElementById("kokasports-fetch-time"));
  }

  // delegated clicks
  document.addEventListener("click", function (e) {
    var b = e.target && e.target.closest ? e.target.closest("[data-play-url],[data-refresh]") : null;
    if (!b) return;
    if (b.hasAttribute("data-play-url")) {
      window.open(b.getAttribute("data-play-url"), "_blank");
      e.preventDefault();
      return;
    }
    var r = b.getAttribute("data-refresh");
    if (r === "sportsonline") {
      localStorage.removeItem(SPORTSONLINE_KEY); localStorage.removeItem(SPORTSONLINE_TIME);
      window.location.reload();
    } else if (r === "kokasports") {
      localStorage.removeItem(KOKA_KEY); localStorage.removeItem(KOKA_TIME);
      window.location.reload();
    }
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
