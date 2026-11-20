/* =====================================================================
   watch.js — multi-source player for OFFICIAL league/governing-body
   YouTube channels (highlights, recaps, press conferences).

   Each source plays the channel's public uploads playlist through
   YouTube's own embed player (youtube-nocookie.com). Nothing loads from
   YouTube until the visitor clicks "Load player".
   Channel IDs verified against https://www.youtube.com/feeds/videos.xml?channel_id=…
   ===================================================================== */
(function () {
  "use strict";

  // Only channels that allow playback on other sites (tested in Chromium 2026-11-20).
  // Not embeddable, so left out: F1, NBA, NFL, FIFA, LaLiga, UEFA, MLB, PGA Tour, IPL, MLS.
  var SOURCES = [
    { id: "UCG5qGWdu8nIRZqJ_GgDwQ-w", label: "Premier League", icon: "⚽" },
    { id: "UC6UL29enLNe4mqwTfAyeNuw", label: "Bundesliga", icon: "⚽" },
    { id: "UCBJeMCIeLQos7wacox4hmLQ", label: "Serie A", icon: "⚽" },
    { id: "UCt2JXOLNxqry7B_4rRZME3Q", label: "ICC Cricket", icon: "🏏" },
    { id: "UCqFMzb-4AUf6WAIbl132QKA", label: "NHL", icon: "🏒" },
    { id: "UCY_5h5zaSwN7Or4kIJDYNXA", label: "ATP Tour", icon: "🎾" },
    { id: "UCaBIVVpHjq6j3tSyxwTE-8Q", label: "WTA", icon: "🎾" },
    { id: "UCNa8NxMgSm7m4Ii9d4QGk1Q", label: "Wimbledon", icon: "🎾" },
    { id: "UCE28rwYoaV7jvU6GVzdu_GQ", label: "World Rugby", icon: "🏉" },
    { id: "UC8pYaQzbBBXg9GIOHRvTmDQ", label: "MotoGP", icon: "🏍️" },
    { id: "UCvgfXK4nTYKudb0rFR6noLA", label: "UFC", icon: "🥊" }
  ];

  // "UULF" + channel id (minus "UC") is the channel's long-form uploads playlist.
  // The plain "UU" uploads list fails to start in embeds when the newest upload is
  // a Short or a live/premiere, so stick to full-length videos.
  function playlistId(channelId) { return "UULF" + channelId.slice(2); }
  function embedUrl(s) {
    return "https://www.youtube-nocookie.com/embed/videoseries?list=" + playlistId(s.id) + "&rel=0&modestbranding=1";
  }
  function channelUrl(s) { return "https://www.youtube.com/channel/" + s.id + "/videos"; }

  function mount() {
    var root = document.getElementById("watch-player");
    if (!root) return;

    var current = 0;
    var loaded = false;

    var tabs = document.createElement("div");
    tabs.className = "watch-tabs";
    tabs.setAttribute("role", "tablist");
    tabs.setAttribute("aria-label", "Video sources");

    SOURCES.forEach(function (s, i) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "watch-tab";
      b.setAttribute("role", "tab");
      b.id = "watch-tab-" + i;
      b.setAttribute("aria-controls", "watch-stage");
      b.textContent = s.icon + " " + s.label;
      b.addEventListener("click", function () { select(i, true); });
      tabs.appendChild(b);
    });

    // Arrow-key navigation between tabs
    tabs.addEventListener("keydown", function (e) {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      var n = (current + (e.key === "ArrowRight" ? 1 : SOURCES.length - 1)) % SOURCES.length;
      select(n, true);
      tabs.children[n].focus();
      e.preventDefault();
    });

    var stage = document.createElement("div");
    stage.className = "watch-stage";
    stage.id = "watch-stage";
    stage.setAttribute("role", "tabpanel");

    var foot = document.createElement("div");
    foot.className = "watch-foot";

    root.appendChild(tabs);
    root.appendChild(stage);
    root.appendChild(foot);

    function renderFacade() {
      var s = SOURCES[current];
      stage.innerHTML = "";
      var f = document.createElement("div");
      f.className = "watch-facade";
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn primary watch-load";
      btn.textContent = "▶ Load " + s.label + " player";
      btn.addEventListener("click", function () { loaded = true; renderPlayer(); });
      var note = document.createElement("p");
      note.textContent = "Plays the official " + s.label + " YouTube channel. Loading the player connects to YouTube.";
      f.appendChild(btn);
      f.appendChild(note);
      stage.appendChild(f);
    }

    function renderPlayer() {
      var s = SOURCES[current];
      stage.innerHTML = "";
      var frame = document.createElement("iframe");
      frame.src = embedUrl(s);
      frame.title = s.label + " — official YouTube channel";
      frame.allow = "accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen";
      frame.allowFullscreen = true;
      stage.appendChild(frame);
    }

    function select(i, userAction) {
      current = i;
      Array.prototype.forEach.call(tabs.children, function (t, j) {
        t.setAttribute("aria-selected", String(j === i));
        t.tabIndex = j === i ? 0 : -1;
      });
      stage.setAttribute("aria-labelledby", "watch-tab-" + i);
      var s = SOURCES[i];
      foot.innerHTML = "";
      var a = document.createElement("a");
      a.href = channelUrl(s);
      a.target = "_blank";
      a.rel = "noopener";
      a.textContent = "Open " + s.label + " on YouTube ↗";
      foot.appendChild(a);
      if (loaded && userAction) renderPlayer(); else renderFacade();
    }

    select(0, false);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})();
