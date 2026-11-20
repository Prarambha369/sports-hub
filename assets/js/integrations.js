/* =====================================================================
   integrations.js — sportsonline.st list + "On TV Today" listings
   Shared by index.html and news.html.

   - TV listings come from data/tv-today.json (same origin), refreshed every
     3 hours by .github/workflows/tv-listings.yml. kokasports.com sends no
     CORS headers, so browsers cannot read it directly.
   - sportsonline.st list: 6-hour localStorage cache.
   ===================================================================== */
(function () {
  "use strict";

  var SPORTSONLINE_KEY = "sh:sportsonline:matches";
  var SPORTSONLINE_TIME = "sh:sportsonline:fetch";
  var SIX_HOURS = 21600000;
  var TV_URL = "data/tv-today.json";
  var EMPTY = '<p class="empty-state">No live data right now (source unavailable).</p>';

  /* ---------- helpers ---------- */
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  // localStorage can throw (private mode, blocked storage) — never let it break rendering.
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
    del: function (k) { try { localStorage.removeItem(k); } catch (e) {} }
  };

  function iconFor(text) {
    var icons = { football: "⚽", soccer: "⚽", cricket: "🏏", basketball: "🏀", nba: "🏀", nfl: "🏈",
      nhl: "🏒", mlb: "⚾", wnba: "🏀", mls: "⚽",
      tennis: "🎾", ufc: "🥊", mma: "🥊", rugby: "🏉", golf: "⛳", boxing: "🥊", hockey: "🏒",
      baseball: "⚾", volleyball: "🏐", f1: "🏎️", racing: "🏎️", motogp: "🏍️" };
    var m = (text || "").match(/\b(football|soccer|cricket|basketball|nba|wnba|nfl|nhl|mlb|mls|tennis|ufc|mma|rugby|golf|boxing|hockey|baseball|volleyball|f1|racing|motogp)\b/i);
    return (m && icons[m[1].toLowerCase()]) || "📺";
  }

  function setBadge(id, fresh) {
    var b = document.getElementById(id);
    if (!b) return;
    b.className = "update-badge " + (fresh ? "fresh" : "cached");
    b.textContent = fresh ? "🆕 Fresh" : "💾 Cached";
  }

  /* ---------- sportsonline.st ---------- */
  function fetchSportsonline(force) {
    var last = store.get(SPORTSONLINE_TIME);
    if (!force && last && Date.now() - +last < SIX_HOURS) {
      try { return Promise.resolve({ items: JSON.parse(store.get(SPORTSONLINE_KEY) || "[]"), fresh: false }); }
      catch (e) { /* corrupt cache: refetch */ }
    }
    return fetch("https://sportsonline.st")
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); })
      .then(function (text) {
        var matches = [];
        text.split("\n").forEach(function (line) {
          var m = line.match(/^\s*([0-9:]+)\s+(.+)\|\s*(https?:\/\/\S+)\s*$/);
          if (m) matches.push({ time: m[1], teams: m[2].trim(), url: m[3].trim() });
        });
        if (matches.length) {
          store.set(SPORTSONLINE_KEY, JSON.stringify(matches));
          store.set(SPORTSONLINE_TIME, String(Date.now()));
        }
        return { items: matches, fresh: true };
      })
      .catch(function () { return { items: [], fresh: false }; });
  }

  function renderSportsonline(grid, timeEl, force) {
    if (!grid) return;
    fetchSportsonline(force).then(function (res) {
      grid.innerHTML = res.items.map(function (m) {
        var teams = m.teams || "-";
        return '<div class="match-card"><div class="match-info"><span class="match-icon">' + iconFor(teams) +
          '</span><span class="match-details"><strong>' + esc(teams) + "</strong><small>" + esc(m.time || "-") +
          '</small></span></div><button class="match-play-btn" data-play-url="' + esc(m.url) + '">Play</button></div>';
      }).join("") || EMPTY;
      var t = store.get(SPORTSONLINE_TIME);
      if (timeEl) timeEl.textContent = t ? new Date(+t).toLocaleTimeString() : "never fetched";
      if (res.items.length) setBadge("sportsonline-fetch-status", res.fresh);
    });
  }

  /* ---------- On TV Today (same-origin JSON) ---------- */
  function fetchTV(force) {
    return fetch(TV_URL, { cache: force ? "reload" : "no-cache" })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .catch(function () { return null; });
  }

  function renderTV(grid, timeEl, limit, force) {
    if (!grid) return;
    fetchTV(force).then(function (data) {
      var fixtures = (data && data.fixtures) || [];
      grid.innerHTML = fixtures.slice(0, limit).map(function (f) {
        var chips = (f.broadcasters || []).map(function (b) {
          return '<span class="tv-chip">' + esc(b) + "</span>";
        }).join("");
        return '<div class="tv-card"><div class="tv-head"><span class="tv-icon">' + iconFor(f.sport + " " + f.competition) +
          '</span><strong class="tv-title">' + esc(f.title) + "</strong></div>" +
          '<div class="tv-meta">' + esc(f.time || "TBD") + (data.timezone ? " " + esc(data.timezone) : "") +
          " · " + esc(f.competition || f.sport || "") + "</div>" +
          '<div class="tv-chips">' + (chips || '<span class="tv-chip">TBA</span>') + "</div></div>";
      }).join("") || EMPTY;
      if (timeEl) {
        var age = data && data.fetchedAt ? Date.now() - Date.parse(data.fetchedAt) : Infinity;
        timeEl.textContent = data && data.fetchedAt
          ? new Date(data.fetchedAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) +
            (data.date ? " · listings for " + data.date : "") +
            (age > 4 * SIX_HOURS ? " (may be out of date)" : "")
          : "never fetched";
      }
      if (data && data.fetchedAt) {
        setBadge("kokasports-fetch-status", Date.now() - Date.parse(data.fetchedAt) < SIX_HOURS);
      }
    });
  }

  /* ---------- boot ---------- */
  var targets = {
    sportsonline: function (force) {
      renderSportsonline(document.querySelector(".sportsonline-match-grid"),
        document.getElementById("sportsonline-fetch-time-home"), force);
      renderSportsonline(document.querySelector(".sportsonline-integration .match-grid"),
        document.getElementById("sportsonline-fetch-time"), force);
    },
    kokasports: function (force) {
      renderTV(document.querySelector(".kokasports-match-grid"),
        document.getElementById("kokasports-fetch-time-home"), 8, force);
      renderTV(document.querySelector(".kokasports-integration .match-grid"),
        document.getElementById("kokasports-fetch-time"), 20, force);
    }
  };

  function init() {
    targets.sportsonline(false);
    targets.kokasports(false);
  }

  // delegated clicks
  document.addEventListener("click", function (e) {
    var b = e.target && e.target.closest ? e.target.closest("[data-play-url],[data-refresh]") : null;
    if (!b) return;
    e.preventDefault();
    if (b.hasAttribute("data-play-url")) {
      var url = b.getAttribute("data-play-url");
      if (/^https?:\/\//i.test(url)) window.open(url, "_blank", "noopener");
      return;
    }
    var key = b.getAttribute("data-refresh");
    if (key === "sportsonline") { store.del(SPORTSONLINE_KEY); store.del(SPORTSONLINE_TIME); }
    if (targets[key]) targets[key](true);
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
