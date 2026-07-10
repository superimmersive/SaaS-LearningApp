/* =============================================================================
   LekkeLeer · Project Overview — shared behaviour
   Single source of truth for navigation + footer (so navbars never drift),
   theme toggle, mobile drawer, activity filters, and scroll reveal.
   ============================================================================= */
(function () {
  "use strict";

  /* ---- Site map ---------------------------------------------------------- */
  var PAGES = [
    { id: "home", label: "Home", href: "index.html" },
    { id: "overview", label: "Overview", href: "overview.html" },
    { id: "roadmap", label: "Roadmap", href: "roadmap.html" },
    { id: "activities", label: "Activities", href: "activity-lib.html" },
    { id: "monetization", label: "Pricing", href: "monetization.html" },
    { id: "proposals", label: "Proposals", href: "proposals.html" }
  ];
  var PHASES = [
    { id: "phase1", n: "1", label: "MVP completion", href: "phase-1.html" },
    { id: "phase2", n: "2", label: "Auth & accounts", href: "phase-2.html" },
    { id: "phase3", n: "3", label: "Expo / Native", href: "phase-3.html" },
    { id: "phase4", n: "4", label: "Lumi Plus", href: "phase-4.html" },
    { id: "phase5", n: "5", label: "Lumi Schools", href: "phase-5.html" }
  ];

  /* ---- Icons (inline SVG) ------------------------------------------------ */
  var ICON = {
    book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 4.5A2.5 2.5 0 0 1 4.5 2H10a2 2 0 0 1 2 2v16a1.5 1.5 0 0 0-1.5-1.5H4.5A2.5 2.5 0 0 1 2 16z"/><path d="M22 4.5A2.5 2.5 0 0 0 19.5 2H14a2 2 0 0 0-2 2v16a1.5 1.5 0 0 1 1.5-1.5h6A2.5 2.5 0 0 0 22 16z"/></svg>',
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    sun: '<svg class="sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4.2"/><path d="M12 2v2.4M12 19.6V22M2 12h2.4M19.6 12H22M4.9 4.9l1.7 1.7M17.4 17.4l1.7 1.7M19.1 4.9l-1.7 1.7M6.6 17.4l-1.7 1.7"/></svg>',
    moon: '<svg class="moon" viewBox="0 0 24 24" fill="currentColor"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>',
    caret: '<svg class="caret" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
  };

  var current = document.body.getAttribute("data-page") || "";
  var onPhase = current.indexOf("phase") === 0;

  /* ---- Build header ------------------------------------------------------ */
  function navLinks() {
    var html = "";
    PAGES.forEach(function (p) {
      if (p.id === "activities") {
        html += phaseDropdown();
      }
      html +=
        '<a class="nav__link' + (p.id === current ? " is-active" : "") +
        '" href="' + p.href + '">' + p.label + "</a>";
    });
    return html;
  }

  function phaseDropdown() {
    var items = PHASES.map(function (ph) {
      return '<a href="' + ph.href + '"' + (ph.id === current ? ' class="is-active"' : "") +
        '><span class="num">' + ph.n + "</span>" + ph.label + "</a>";
    }).join("");
    return (
      '<details class="nav__dd"' + (onPhase ? " open" : "") + '>' +
      '<summary class="nav__link' + (onPhase ? " is-active" : "") + '">Phases ' + ICON.caret + "</summary>" +
      '<div class="nav__menu">' + items + "</div>" +
      "</details>"
    );
  }

  var header =
    '<div class="topbar"><div class="topbar__inner">' +
    '<a class="brand" href="index.html">' +
    '<span class="brand__mark">' + ICON.book + "</span>" +
    '<span>Lekke<span>Leer</span></span>' +
    '<span class="brand__badge">Project Overview</span>' +
    "</a>" +
    '<nav class="nav" aria-label="Primary">' + navLinks() + "</nav>" +
    '<button class="icon-btn theme-toggle" type="button" data-theme-toggle aria-label="Toggle dark mode">' + ICON.sun + ICON.moon + "</button>" +
    '<button class="icon-btn nav-toggle" type="button" data-drawer-open aria-label="Open menu" aria-expanded="false">' + ICON.menu + "</button>" +
    "</div></div>";

  /* ---- Build drawer ------------------------------------------------------ */
  function drawerLinks() {
    var main = PAGES.map(function (p) {
      return '<a class="' + (p.id === current ? "is-active" : "") + '" href="' + p.href + '">' + p.label + "</a>";
    }).join("");
    var phases = PHASES.map(function (ph) {
      return '<a class="' + (ph.id === current ? "is-active" : "") + '" href="' + ph.href + '">Phase ' + ph.n + " · " + ph.label + "</a>";
    }).join("");
    return main + '<span class="drawer__label">Roadmap phases</span>' + phases;
  }

  var drawer =
    '<div class="drawer-backdrop" data-drawer-close></div>' +
    '<aside class="drawer" aria-label="Menu">' +
    '<div class="drawer__head">' +
    '<a class="brand" href="index.html"><span class="brand__mark">' + ICON.book + '</span><span>Lekke<span>Leer</span></span></a>' +
    '<button class="icon-btn" type="button" data-drawer-close aria-label="Close menu">' + ICON.close + "</button>" +
    "</div>" +
    '<nav class="drawer__nav" aria-label="Mobile">' + drawerLinks() + "</nav>" +
    "</aside>";

  /* ---- Build footer ------------------------------------------------------ */
  var year = new Date().getFullYear();
  var footer =
    '<footer class="site-footer"><div class="site-footer__inner">' +
    "<p>&copy; " + year + " LekkeLeer &middot; SuperImmersive &mdash; Project Overview</p>" +
    '<div class="site-footer__links">' +
    '<a href="index.html">Home</a>' +
    '<a href="roadmap.html">Roadmap</a>' +
    '<a href="monetization.html">Pricing</a>' +
    '<a href="mailto:devon@superimmersive.io">devon@superimmersive.io</a>' +
    "</div></div></footer>";

  /* ---- Inject ------------------------------------------------------------ */
  var navMount = document.getElementById("site-nav");
  if (!navMount) {
    navMount = document.createElement("div");
    document.body.insertBefore(navMount, document.body.firstChild);
  }
  navMount.outerHTML = header + drawer;

  var footMount = document.getElementById("site-footer");
  if (footMount) {
    footMount.outerHTML = footer;
  } else {
    document.body.insertAdjacentHTML("beforeend", footer);
  }

  /* ---- Theme toggle ------------------------------------------------------ */
  var root = document.documentElement;
  function setTheme(t) {
    root.setAttribute("data-theme", t);
    try { localStorage.setItem("ll-theme", t); } catch (e) {}
  }
  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-theme-toggle]");
    if (!t) return;
    setTheme(root.getAttribute("data-theme") === "dark" ? "light" : "dark");
  });

  /* ---- Mobile drawer ----------------------------------------------------- */
  var drawerEl = document.querySelector(".drawer");
  var backdropEl = document.querySelector(".drawer-backdrop");
  var openBtn = document.querySelector("[data-drawer-open]");
  function openDrawer() {
    drawerEl.classList.add("is-open");
    backdropEl.classList.add("is-open");
    if (openBtn) openBtn.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
  }
  function closeDrawer() {
    drawerEl.classList.remove("is-open");
    backdropEl.classList.remove("is-open");
    if (openBtn) openBtn.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  }
  document.addEventListener("click", function (e) {
    if (e.target.closest("[data-drawer-open]")) openDrawer();
    else if (e.target.closest("[data-drawer-close]")) closeDrawer();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && drawerEl.classList.contains("is-open")) closeDrawer();
  });

  /* Close the desktop Phases dropdown when clicking outside */
  document.addEventListener("click", function (e) {
    document.querySelectorAll(".nav__dd[open]").forEach(function (dd) {
      if (!dd.contains(e.target)) dd.removeAttribute("open");
    });
  });

  /* ---- Activity filters -------------------------------------------------- */
  var filterBar = document.querySelector("[data-filter-bar]");
  if (filterBar) {
    var cards = Array.prototype.slice.call(document.querySelectorAll(".activity-card"));
    var countEl = document.querySelector("[data-filter-count]");
    var active = "all";
    function applyFilter() {
      var shown = 0;
      cards.forEach(function (card) {
        var tags = (card.getAttribute("data-tags") || "").split(" ");
        var match = active === "all" || tags.indexOf(active) !== -1;
        card.classList.toggle("is-hidden", !match);
        if (match) shown++;
      });
      if (countEl) countEl.textContent = shown + (shown === 1 ? " activity" : " activities");
      var empty = document.querySelector("[data-empty]");
      if (empty) empty.style.display = shown ? "none" : "block";
    }
    filterBar.addEventListener("click", function (e) {
      var btn = e.target.closest(".filter-btn");
      if (!btn) return;
      active = btn.getAttribute("data-filter");
      filterBar.querySelectorAll(".filter-btn").forEach(function (b) {
        b.classList.toggle("is-active", b === btn);
      });
      applyFilter();
    });
    applyFilter();
  }

  /* ---- Scroll reveal ----------------------------------------------------- */
  var reveals = document.querySelectorAll(".reveal");
  if (reveals.length && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("is-in"); });
  }
})();
