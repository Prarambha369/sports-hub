/* =====================================================================
   news.js: renders headlines from data/news.json (same origin), built
   every 3 hours from BBC Sport and ESPN RSS by
   .github/workflows/news-refresh.yml. Each card links to the original
   story; only the headline and a short summary are shown here.

   Mount points:
   - #articles  (news.html): full list, filtered by ?sport=<key>
   - #headlines (index.html): latest few, with data-limit
   ===================================================================== */
(function () {
  "use strict";

  var ICONS = { football: "⚽", cricket: "🏏", nba: "🏀", nfl: "🏈", f1: "🏎️", ufc: "🥊", tennis: "🎾",
    rugby: "🏉", golf: "⛳", boxing: "🥊", hockey: "🏒" };

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function ago(isoDate) {
    var t = Date.parse(isoDate);
    if (isNaN(t)) return "";
    var mins = Math.round((Date.now() - t) / 60000);
    if (mins < 60) return Math.max(mins, 1) + " min ago";
    var hrs = Math.round(mins / 60);
    if (hrs < 48) return hrs + " h ago";
    return new Date(t).toLocaleDateString([], { month: "short", day: "numeric" });
  }

  function cardHTML(it) {
    return (
      '<article class="article">' +
        '<div class="thumb" aria-hidden="true">' + (ICONS[it.sport] || "📰") + "</div>" +
        '<div class="body">' +
          '<span class="tag">' + esc(it.sportLabel) + "</span>" +
          '<h2><a href="' + esc(it.link) + '" target="_blank" rel="noopener">' + esc(it.title) + "</a></h2>" +
          (it.summary ? "<p>" + esc(it.summary) + "</p>" : "") +
          '<p class="meta">' + esc(it.source) + (it.published ? " · " + esc(ago(it.published)) : "") + "</p>" +
        "</div>" +
      "</article>"
    );
  }

  function load() {
    return fetch("data/news.json", { cache: "no-cache" })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .catch(function () { return null; });
  }

  function render(host, items, empty) {
    host.innerHTML = items.length ? items.map(cardHTML).join("") : '<p class="muted">' + empty + "</p>";
  }

  function mount() {
    var list = document.getElementById("articles");
    var strip = document.getElementById("headlines");
    if (!list && !strip) return;

    load().then(function (data) {
      var items = (data && data.items) || [];
      var updated = document.getElementById("news-updated");
      if (updated && data && data.fetchedAt) {
        updated.textContent = "Updated " + ago(data.fetchedAt);
      }

      if (list) {
        var sport = new URLSearchParams(location.search).get("sport");
        var filtered = sport ? items.filter(function (it) { return it.sport === sport; }) : items;
        if (sport && filtered.length) {
          var label = filtered[0].sportLabel;
          document.getElementById("news-title").textContent = label + " News";
          document.getElementById("news-sub").textContent = "Latest " + label + " headlines from " + filtered[0].source + ".";
          document.title = label + " News | Kick Sports";
        }
        render(list, filtered, sport ? "No headlines for this sport right now." : "No headlines right now. Check back soon.");
      }

      if (strip) {
        // One story per sport first, so the home strip isn't all one league.
        var limit = +strip.getAttribute("data-limit") || 6, seen = {}, mixed = [];
        items.forEach(function (it) { if (!seen[it.sport] && mixed.length < limit) { seen[it.sport] = 1; mixed.push(it); } });
        items.forEach(function (it) { if (mixed.length < limit && mixed.indexOf(it) < 0) mixed.push(it); });
        render(strip, mixed, "No headlines right now.");
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})();
