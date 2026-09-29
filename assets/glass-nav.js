// Shared glass nav: full pill at the top, morphs into a round "…" button after
// scrolling, and the button opens the links as a glass popover.
// Plain script (no library needed): without JS the pill simply stays full.
(() => {
  const nav = document.querySelector("[data-gnav]");
  if (!nav) return;
  const pill = nav.querySelector(".gnav-pill");
  const links = nav.querySelector(".gnav-links");
  const more = nav.querySelector(".gnav-more");
  if (!pill || !links || !more) return;

  // Build the popover from the same links (only one copy is ever exposed: the
  // pill links are visibility:hidden whenever the popover can be shown).
  const menu = document.createElement("div");
  menu.className = "gnav-menu";
  menu.id = "gnav-menu";
  menu.hidden = true;
  const ul = document.createElement("ul");
  for (const a of links.querySelectorAll("a")) {
    const li = document.createElement("li");
    li.append(a.cloneNode(true));
    ul.append(li);
  }
  // Same slot markup as the rest of the page, so assets/glass-ui.js upgrades it.
  menu.innerHTML =
    '<div class="lg-slot" data-lg="material" data-lg-optics="panel" data-lg-block><div class="glass tint-ink"></div></div>';
  menu.querySelector(".glass").append(ul);
  nav.querySelector(".gnav-anchor").append(menu);
  more.setAttribute("aria-controls", menu.id);
  more.setAttribute("aria-expanded", "false");

  const COMPACT_AT = 72, FULL_AT = 24;
  let state = "full";

  const measure = () => {
    if (state === "full") nav.style.setProperty("--gnav-w", `${links.offsetWidth}px`);
    else nav.style.setProperty("--gnav-w", "50px");
  };

  const setState = (next) => {
    if (next === state) return;
    const wasOpen = state === "open";
    state = next;
    nav.dataset.state = next;
    measure();
    if (next === "open") {
      more.setAttribute("aria-expanded", "true");
      more.setAttribute("aria-label", "Fechar menu");
      menu.classList.remove("is-closing");
      menu.hidden = false;
      menu.classList.add("is-open");
      menu.querySelector("a")?.focus({ preventScroll: true });
    } else if (wasOpen) {
      more.setAttribute("aria-expanded", "false");
      more.setAttribute("aria-label", "Abrir menu");
      menu.classList.remove("is-open");
      menu.classList.add("is-closing");
      const done = () => {
        if (state === "open") return;
        menu.classList.remove("is-closing");
        menu.hidden = true;
      };
      menu.addEventListener("animationend", done, { once: true });
      setTimeout(done, 400);
    }
  };

  const onScroll = () => {
    const y = window.scrollY;
    if (y <= FULL_AT) setState("full");
    else if (y > COMPACT_AT && state === "full") setState("compact");
  };
  let ticking = false;
  window.addEventListener("scroll", () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { ticking = false; onScroll(); });
  }, { passive: true });

  more.addEventListener("click", () => setState(state === "open" ? "compact" : "open"));
  menu.addEventListener("click", (e) => {
    if (e.target.closest("a")) setState(window.scrollY <= FULL_AT ? "full" : "compact");
  });
  document.addEventListener("pointerdown", (e) => {
    if (state === "open" && !nav.contains(e.target)) setState("compact");
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && state === "open") { setState("compact"); more.focus(); }
  });
  window.addEventListener("resize", measure, { passive: true });
  // Links inside the pill may be moved into <Glass> later; they keep their size.
  new ResizeObserver(() => { if (state === "full") measure(); }).observe(links);

  nav.dataset.state = "full";
  measure();
  onScroll();
  requestAnimationFrame(() => requestAnimationFrame(() => nav.classList.add("is-ready")));
})();
