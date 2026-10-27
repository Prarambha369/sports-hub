/* =====================================================================
   sports-hub shared site script
   - injects header + footer + cookie banner
   - GDPR-style consent gate: analytics + ad scripts load ONLY after
     explicit "Accept". Consent stored in localStorage.
   ===================================================================== */

(function () {
  "use strict";

  var BRAND = "Kick Sports";           // <-- rename your brand here
  var CONTACT_EMAIL = "hello@example.com"; // <-- your contact email
  var CONSENT_KEY = "sh_cookie_consent_v1";

  // Resolve relative path prefix so pages in /legal/ still find assets.
  var inSub = /\/legal\//.test(location.pathname);
  var ROOT = inSub ? "../" : "./";

  /* ---------- Header ---------- */
  function headerHTML() {
    var links = [
      ["Home", ROOT + "index.html"],
      ["News", ROOT + "news.html"],
      ["Contact", ROOT + "contact.html"],
      ["Partnership", ROOT + "partnership.html"]
    ];
    var items = links.map(function (l) {
      return '<a href="' + l[1] + '">' + l[0] + "</a>";
    }).join("");
    return (
      '<header class="site-header"><div class="container nav">' +
        '<a class="brand" href="' + ROOT + 'index.html">' +
          '<span class="logo">K</span>' + BRAND +
        "</a>" +
        '<button class="nav-toggle" aria-label="Menu" aria-expanded="false">☰</button>' +
        '<nav class="nav-links">' + items + "</nav>" +
      "</div></header>"
    );
  }

  /* ---------- Footer ---------- */
  function footerHTML() {
    var year = new Date().getFullYear();
    return (
      '<footer class="site-footer">' +
        '<div class="container footer-grid">' +
          "<div>" +
            "<h4>" + BRAND + "</h4>" +
            '<p style="color:var(--muted);max-width:340px">Your hub for sports news &mdash; ' +
              "football, cricket, NBA, NFL, F1 and more. Scores and headlines, updated daily.</p>" +
          "</div>" +
          "<div><h4>Quick Links</h4><ul>" +
            '<li><a href="' + ROOT + 'index.html">Home</a></li>' +
            '<li><a href="' + ROOT + 'news.html">News</a></li>' +
            '<li><a href="' + ROOT + 'contact.html">Contact</a></li>' +
            '<li><a href="' + ROOT + 'partnership.html">Partnership</a></li>' +
          "</ul></div>" +
          "<div><h4>Legal</h4><ul>" +
            '<li><a href="' + ROOT + 'legal/privacy.html">Privacy Policy</a></li>' +
            '<li><a href="' + ROOT + 'legal/cookies.html">Cookies Policy</a></li>' +
            '<li><a href="' + ROOT + 'legal/disclaimer.html">Disclaimer</a></li>' +
            '<li><a href="' + ROOT + 'legal/dmca.html">DMCA</a></li>' +
          "</ul></div>" +
        "</div>" +
        '<div class="disclaimer-strip container">DISCLAIMER: ' + BRAND +
          " publishes sports news and publicly available score data only. We do not host, " +
          "stream, or distribute any live match footage. Always verify with official sources.</div>" +
        '<div class="footer-bottom">&copy; ' + year + " " + BRAND +
          '. All rights reserved. &middot; <a href="#" data-cookie-reopen>Cookie settings</a></div>' +
      "</footer>"
    );
  }

  /* ---------- Cookie banner ---------- */
  function cookieHTML() {
    return (
      '<div class="cookie-banner" role="dialog" aria-label="Cookie consent">' +
        "<p>We use cookies to analyse traffic and serve personalised ads. " +
        "Necessary cookies are always on. You can accept all, reject non-essential, " +
        'or read our <a href="' + ROOT + 'legal/cookies.html">Cookies Policy</a>.</p>' +
        '<div class="cookie-actions">' +
          '<button class="btn primary" data-consent="all">Accept All</button>' +
          '<button class="btn" data-consent="reject">Reject Non-Essential</button>' +
        "</div>" +
      "</div>"
    );
  }

  /* ---------- Consent-gated third-party loading ---------- */
  function loadAnalytics() {
    // Replace G-XXXXXXX with your GA4 Measurement ID.
    var GA_ID = "G-XXXXXXX";
    if (GA_ID.indexOf("XXXX") !== -1) return; // not configured yet
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + GA_ID;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }
    gtag("js", new Date());
    gtag("config", GA_ID, { anonymize_ip: true });
  }

  function loadAds() {
    // Replace ca-pub-XXXX with your AdSense publisher ID.
    var PUB_ID = "ca-pub-XXXXXXXXXXXXXXXX";
    if (PUB_ID.indexOf("XXXX") !== -1) return; // not configured yet
    var s = document.createElement("script");
    s.async = true;
    s.crossOrigin = "anonymous";
    s.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=" + PUB_ID;
    document.head.appendChild(s);
    document.querySelectorAll("ins.adsbygoogle").forEach(function () {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    });
  }

  function applyConsent(value) {
    if (value === "all") { loadAnalytics(); loadAds(); }
  }

  /* ---------- Boot ---------- */
  function boot() {
    var mount = function (id, html) {
      var el = document.getElementById(id);
      if (el) el.innerHTML = html;
    };
    mount("site-header", headerHTML());
    mount("site-footer", footerHTML());

    // cookie banner appended to body
    var wrap = document.createElement("div");
    wrap.innerHTML = cookieHTML();
    document.body.appendChild(wrap.firstChild);
    var banner = document.querySelector(".cookie-banner");

    // nav toggle
    var toggle = document.querySelector(".nav-toggle");
    var links = document.querySelector(".nav-links");
    if (toggle && links) {
      toggle.addEventListener("click", function () {
        var open = links.classList.toggle("open");
        toggle.setAttribute("aria-expanded", String(open));
      });
    }

    // consent state
    var saved = null;
    try { saved = localStorage.getItem(CONSENT_KEY); } catch (e) {}
    if (saved) {
      applyConsent(saved);
    } else if (banner) {
      banner.classList.add("show");
    }

    // consent buttons
    document.querySelectorAll("[data-consent]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var val = btn.getAttribute("data-consent");
        try { localStorage.setItem(CONSENT_KEY, val); } catch (e) {}
        if (banner) banner.classList.remove("show");
        applyConsent(val);
      });
    });

    // reopen from footer
    var reopen = document.querySelector("[data-cookie-reopen]");
    if (reopen && banner) {
      reopen.addEventListener("click", function (e) {
        e.preventDefault();
        try { localStorage.removeItem(CONSENT_KEY); } catch (e2) {}
        banner.classList.add("show");
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
